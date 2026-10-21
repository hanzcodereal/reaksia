import axios from 'axios';
import { DEFAULT_VIP_KEYS, VipKey } from './keys';

const API_ENDPOINT = 'https://apiv2.reactionwa.online/api/v2/react';
const LINK_REGEX =
  /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]+)\/(\d+)/i;
const EMOJI_REGEX = /\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?/gu;

export interface ReactResult {
  time: string;
  status: boolean;
  message?: string;
  error?: string;
  data?: {
    task_id: string | null;
    target: string;
    emojis: string;
    vip_key: string;
    vip_package: string;
    points_remaining: number | null;
  };
}

let keyIndex = 0;

export function normalizeUrl(inputUrl: string): string | null {
  const match = String(inputUrl || '').match(LINK_REGEX);
  if (!match) return null;
  return `https://whatsapp.com/channel/${match[1]}/${match[2]}`;
}

export function parseEmojis(inputEmoji: string): string | null {
  const matches = String(inputEmoji || '').match(EMOJI_REGEX);
  if (!matches || matches.length === 0) return null;
  return matches.slice(0, 5).join(', ');
}

async function sendReactionRequest(
  targetUrl: string,
  reactionText: string,
  keyObj: VipKey
) {
  const origin =
    keyObj.domain === '*' ? 'https://reactionwa.online' : keyObj.domain;
  const referer = origin.endsWith('/') ? origin : origin + '/';

  const response = await axios.post(
    API_ENDPOINT,
    { url: targetUrl, reaction: reactionText },
    {
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        Referer: referer,
        'x-api-key': keyObj.apiKey,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
      },
      timeout: 9000
    }
  );

  return response.data;
}

export async function react(
  targetUrl: string,
  reactionInput: string,
  keys: VipKey[] = DEFAULT_VIP_KEYS
): Promise<ReactResult> {
  const startTime = Date.now();

  const normalizedUrl = normalizeUrl(targetUrl);
  if (!normalizedUrl) {
    return {
      time: `${Date.now() - startTime}ms`,
      status: false,
      error: 'URL channel tidak valid.'
    };
  }

  const emojiString = parseEmojis(reactionInput);
  if (!emojiString) {
    return {
      time: `${Date.now() - startTime}ms`,
      status: false,
      error: 'Emoji tidak valid.'
    };
  }

  const pool = keys.length > 0 ? keys : DEFAULT_VIP_KEYS;
  let attempts = 0;
  let lastError = 'Semua VIP key limit / sibuk.';

  while (attempts < pool.length) {
    const currentKey = pool[keyIndex % pool.length];
    keyIndex = (keyIndex + 1) % pool.length;

    try {
      const result = await sendReactionRequest(
        normalizedUrl,
        emojiString,
        currentKey
      );

      if (result && (result.success === true || result.status === 'success')) {
        const task = (result.data && result.data.task) || {};
        const vipInfo = (result.data && result.data.vip) || {};

        return {
          time: `${Date.now() - startTime}ms`,
          status: true,
          message: result.message || 'Reaction masuk antrean.',
          data: {
            task_id: task.key_id || null,
            target: normalizedUrl,
            emojis: task.reaction_code || emojiString,
            vip_key: currentKey.name,
            vip_package: vipInfo.packageName || 'VIP Permanent',
            points_remaining:
              vipInfo.pointRemaining !== undefined
                ? vipInfo.pointRemaining
                : null
          }
        };
      }

      if (result && result.error) lastError = result.error;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errData = axiosErr.response && axiosErr.response.data;
      lastError = errData?.error || axiosErr.message || 'Server error.';
    }

    attempts++;
  }

  return {
    time: `${Date.now() - startTime}ms`,
    status: false,
    error: lastError
  };
  }
