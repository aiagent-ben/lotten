"use client";

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';

export default function NewsletterForm() {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorCode(null);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorCode(data.code || 'subscribe_failed');
        setStatus('error');
        return;
      }

      setStatus('success');
      setEmail('');
    } catch {
      setErrorCode('server_error');
      setStatus('error');
    }
  };

  const errorMessage =
    errorCode === 'invalid_email'
      ? t('error_invalid_email')
      : errorCode === 'server_error'
      ? t('error_server_error')
      : t('error_subscribe_failed');

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="email" className="sr-only">
          {t('email_label')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('email_placeholder')}
          required
          disabled={status === 'loading' || status === 'success'}
          className={`flex-1 px-5 py-3.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent backdrop-blur-sm transition-all ${
            status === 'success'
              ? 'bg-green-500/20 border-green-500/50'
              : status === 'error'
              ? 'bg-red-500/20 border-red-500/50'
              : ''
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`px-8 py-3.5 text-white font-medium rounded-lg transition-colors whitespace-nowrap ${
            status === 'loading'
              ? 'bg-amber-600/50 cursor-wait'
              : status === 'success'
              ? 'bg-green-600 cursor-default'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          {status === 'loading'
            ? t('subscribing')
            : status === 'success'
            ? t('subscribed')
            : t('subscribe')}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-sm text-amber-200" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
