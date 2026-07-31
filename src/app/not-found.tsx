import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '4rem 2rem', fontFamily: 'system-ui', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '400px', textAlign: 'center' }}>
        <p style={{ fontSize: '3rem', marginBottom: '1rem', color: '#78350f', fontWeight: 700 }}>404</p>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page not found</h1>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link
          href="/en"
          style={{ padding: '0.5rem 1rem', background: '#78350f', color: 'white', textDecoration: 'none', borderRadius: '4px', display: 'inline-block' }}
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
