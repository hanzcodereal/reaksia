import axios from 'axios';
import {
  DEFAULT_VIP_KEYS,
  VIP_CREDENTIALS,
  VipKey
} from './keys';

const API_ENDPOINT = 'https://apiv2.reactionwa.online/api/v2/react';
const GEN_KEY_ENDPOINT =
  'https://apiv2.reactionwa.online/api/v2/generate_key';
const FIREBASE_API_KEY = 'AIzaSyDNbAlgLycK0oRO8I9ja3mPnIccZkOz0M0';
const RTDB_URL =
  'https://autoreactberry-default-rtdb.asia-southeast1.firebasedatabase.app/api_keys.json';

const LINK_REGEX =
  /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]+)\/(\d+)/i;
const EMOJI_REGEX = /\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?/gu;

const SYNC_TTL_MS = 5 * 60 * 1000;

let cachedKeys: VipKey[] | null = null;
let lastSync = 0;
let keyIndex = 0;

export interface KeyAttempt {
  key: string;
  ok: boolean;
  error?: string;
}

export interface ReactResult {
  time: string;
  status: boolean;
  message?: string;
  error?: string;
  attempts?: KeyAttempt[];
  data?: {
    task_id: string | null;
    target: string;
    emojis: string;
    vip_key: string;
    vip_package: string;
    points_remaining: number | null;
  };
}

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

export async function generateVipApiKey(
  vipKeyName: string,
  targetDomain: string
): Promise<string | null> {
  const cred = VIP_CREDENTIALS[vipKeyName];
  if (!cred) return null;
  try {
    const res = await axios.post(
      GEN_KEY_ENDPOINT,
      {
        vipKey: vipKeyName,
        email: cred.email,
        domain: targetDomain,
        uid: cred.uid
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000
      }
    );
    if (res.data && res.data.success && res.data.apiKey) {
      return res.data.apiKey as string;
    }
  } catch {}
  return null;
}

export async function syncVipKeys(): Promise<VipKey[] | null> {
  try {
    const authRes = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      { returnSecureToken: true },
      {
        headers: { Referer: 'https://reactionwa.online/' },
        timeout: 8000
      }
    );
    const idToken = authRes.data && authRes.data.idToken;
    if (!idToken) return null;

    const dbRes = await axios.get(`${RTDB_URL}?auth=${idToken}`, {
      timeout: 8000
    });
    if (!dbRes.data || typeof dbRes.data !== 'object') return null;

    const freshKeys: VipKey[] = [];
    for (const [name, val] of Object.entries(
      dbRes.data as Record<string, { active?: boolean; domain?: string; apiKey?: string }>
    )) {
      if (!val || val.active === false) continue;

      let domain = val.domain || 'https://reactionwa.online';
      let apiKey = val.apiKey;

      if (domain === '*' || !apiKey) {
        domain = 'https://mytestdomain.com';
        const genKey = await generateVipApiKey(name, domain);
        if (genKey) apiKey = genKey;
      }

      if (apiKey) {
        freshKeys.push({ name, apiKey, domain });
      }
    }

    if (freshKeys.length > 0) {
      cachedKeys = freshKeys;
      lastSync = Date.now();
      return freshKeys;
    }
  } catch {}
  return null;
}

async function getKeys(): Promise<VipKey[]> {
  const fresh = Date.now() - lastSync > SYNC_TTL_MS;
  if (fresh) {
    const synced = await syncVipKeys();
    if (synced && synced.length > 0) return synced;
  }
  if (cachedKeys && cachedKeys.length > 0) return cachedKeys;
  return DEFAULT_VIP_KEYS;
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
  keys?: VipKey[]
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

  const pool =
    keys && keys.length > 0 ? keys : await getKeys();
  if (!pool || pool.length === 0) {
    return {
      time: `${Date.now() - startTime}ms`,
      status: false,
      error: 'Tidak ada API key tersedia.'
    };
  }

  const attemptsLog: KeyAttempt[] = [];

  for (let i = 0; i < pool.length; i++) {
    const currentKey = pool[(keyIndex + i) % pool.length];

    try {
      const result = await sendReactionRequest(
        normalizedUrl,
        emojiString,
        currentKey
      );

      if (result && (result.success === true || result.status === 'success')) {
        const task = (result.data && result.data.task) || {};
        const vipInfo = (result.data && result.data.vip) || {};

        attemptsLog.push({ key: currentKey.name, ok: true });
        keyIndex = (keyIndex + i + 1) % pool.length;

        return {
          time: `${Date.now() - startTime}ms`,
          status: true,
          message: result.message || 'Reaction masuk antrean.',
          attempts: attemptsLog,
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

      attemptsLog.push({
        key: currentKey.name,
        ok: false,
        error: (result && result.error) || 'gagal tanpa pesan'
      });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errData = axiosErr.response && axiosErr.response.data;
      attemptsLog.push({
        key: currentKey.name,
        ok: false,
        error: errData?.error || axiosErr.message || 'Server error.'
      });
    }
  }

  keyIndex = (keyIndex + 1) % pool.length;

  return {
    time: `${Date.now() - startTime}ms`,
    status: false,
    error: `Semua ${pool.length} API key gagal.`,
    attempts: attemptsLog
  };
}
