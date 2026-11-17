'use client';

import { useEffect, useState } from 'react';

const COPY: Record<'en' | 'my' | 'zh', { lang: string; title: string; desc: string; retry: string }> = {
  en: {
    lang: 'en',
    title: 'Something went wrong!',
    desc: 'An unexpected error occurred.',
    retry: 'Try again',
  },
  my: {
    lang: 'ms',
    title: 'Sesuatu telah berlaku!',
    desc: 'Ralat tidak dijangka telah berlaku.',
    retry: 'Cuba lagi',
  },
  zh: {
    lang: 'zh',
    title: '出现了一些问题！',
    desc: '发生了意外错误。',
    retry: '重试',
  },
};

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [loc, setLoc] = useState<'en' | 'my' | 'zh'>('en');

  useEffect(() => {
    const seg = window.location.pathname.split('/')[1];
    if (seg === 'my' || seg === 'zh') {
      setLoc(seg);
    }
  }, []);

  const copy = COPY[loc];

  return (
    <html lang={copy.lang}>
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{copy.title}</h1>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>{error?.message || copy.desc}</p>
            <button
              onClick={unstable_retry}
              style={{ padding: '0.5rem 1rem', background: '#78350f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {copy.retry}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
