'use client';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong!</h1>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>{error?.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={unstable_retry}
              style={{ padding: '0.5rem 1rem', background: '#78350f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
