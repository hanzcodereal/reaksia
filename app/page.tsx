'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Level = 'info' | 'ok' | 'err' | 'cmd';

interface Line {
  id: number;
  ts: string;
  level: Level;
  text: string;
}

interface ApiRes {
  time?: string;
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

const QUICK = ['👍', '❤️', '🔥', '💦', '😂', '🎉', '😮', '😢', '🙏', '👏'];
const MAX_EMOJI = 5;

export default function Page() {
  const [url, setUrl] = useState('');
  const [selected, setSelected] = useState<string[]>(['👍']);
  const [manual, setManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Line[]>([]);
  const [ok, setOk] = useState(0);
  const [fail, setFail] = useState(0);
  const id = useRef(0);
  const term = useRef<HTMLDivElement>(null);

  const push = useCallback((level: Level, text: string) => {
    const ts = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setLogs((p) => [...p.slice(-199), { id: id.current++, ts, level, text }]);
  }, []);

  useEffect(() => {
    push('info', 'Reaksia siap.');
  }, [push]);

  useEffect(() => {
    if (term.current) term.current.scrollTop = term.current.scrollHeight;
  }, [logs]);

  const toggleEmoji = (em: string) => {
    setSelected((prev) => {
      if (prev.includes(em)) {
        return prev.filter((x) => x !== em);
      }
      if (prev.length >= MAX_EMOJI) {
        push('err', `max ${MAX_EMOJI} emoji.`);
        return prev;
      }
      return [...prev, em];
    });
  };

  const combinedEmoji = (() => {
    const parts = [...selected];
    if (manual.trim()) parts.push(manual.trim());
    return parts.join(' ');
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!combinedEmoji) {
      push('err', 'pilih minimal 1 emoji.');
      return;
    }
    setLoading(true);
    push('cmd', `$ react ${combinedEmoji}`);

    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, emoji: combinedEmoji })
      });
      const data: ApiRes = await res.json();

      if (data.status) {
        push('ok', `✔ ${data.time}`);
        if (data.data) {
          push(
            'info',
            `key ${data.data.vip_key} · point ${data.data.points_remaining ?? 'n/a'}`
          );
        }
        setOk((n) => n + 1);
      } else {
        push('err', `✖ ${data.error ?? 'gagal'}`);
        setFail((n) => n + 1);
      }
    } catch {
      push('err', '✖ koneksi gagal');
      setFail((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const color: Record<Level, string> = {
    info: 'text-neutral-400',
    ok: 'text-acid',
    err: 'text-red-400',
    cmd: 'text-neon'
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-acid">Reaksia</span>
          <span className="ml-2 font-mono text-sm text-neutral-600">v1</span>
        </h1>
        <span className="rounded-full border border-edge bg-panel px-3 py-1 font-mono text-xs text-acid">
          ● online
        </span>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-6">
        <div className="rounded-2xl border border-edge bg-panel p-5 md:col-span-4 md:row-span-4">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-neutral-500">
            input
          </p>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="whatsapp.com/channel/.../123"
              className="w-full rounded-xl border border-edge bg-ink px-4 py-3 font-mono text-sm text-neutral-200 outline-none focus:border-acid/60"
              required
            />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  emoji
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  {selected.length}/{MAX_EMOJI}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {QUICK.map((em) => {
                  const active = selected.includes(em);
                  return (
                    <button
                      key={em}
                      type="button"
                      onClick={() => toggleEmoji(em)}
                      className={
                        'aspect-square rounded-xl border text-xl transition ' +
                        (active
                          ? 'border-acid bg-acid/10 text-acid'
                          : 'border-edge bg-ink hover:border-acid/50')
                      }
                    >
                      {em}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="atau ketik emoji manual (opsional)"
                className="mt-2 w-full rounded-xl border border-edge bg-ink px-4 py-3 font-mono text-sm text-neutral-200 outline-none focus:border-acid/60"
              />

              {combinedEmoji && (
                <p className="mt-2 break-all font-mono text-xs text-neutral-500">
                  target: <span className="text-neutral-300">{combinedEmoji}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-acid px-5 py-3 font-mono text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? '⏳ mengirim...' : '▶ kirim'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-edge bg-panel p-5 md:col-span-2 md:row-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            sukses
          </p>
          <p className="mt-2 text-3xl font-black text-acid">{ok}</p>
        </div>

        <div className="rounded-2xl border border-edge bg-panel p-5 md:col-span-2 md:row-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            gagal
          </p>
          <p className="mt-2 text-3xl font-black text-red-400">{fail}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-edge bg-ink md:col-span-6 md:row-span-2">
          <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            <span className="ml-2 font-mono text-xs text-neutral-600">log</span>
          </div>
          <div
            ref={term}
            className="scrollbar-thin h-56 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
          >
            {logs.map((l) => (
              <div key={l.id} className="whitespace-pre-wrap break-all">
                <span className="text-neutral-600">[{l.ts}]</span>{' '}
                <span className={color[l.level]}>{l.text}</span>
              </div>
            ))}
            <div className="cursor-blink" />
          </div>
        </div>
      </section>

      <footer className="mt-10 flex items-center justify-between border-t border-edge pt-5 font-mono text-xs text-neutral-600">
        <span>
          by <span className="text-acid">Hanzz Forum Grupp</span>
        </span>
        <span>Reaksia v1</span>
      </footer>
    </main>
  );
    }
