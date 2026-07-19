"use client";

import { useState, FormEvent } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
      <label htmlFor="email" className="sr-only">Email address</label>
      <input
        type="email"
        id="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        disabled={status === 'loading' || status === 'success'}
        className={`flex-1 px-5 py-3.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent backdrop-blur-sm transition-all ${
          status === 'success' ? 'bg-green-500/20 border-green-500/50' :
          status === 'error' ? 'bg-red-500/20 border-red-500/50' : ''
        }`}
      />
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        className={`px-8 py-3.5 text-white font-medium rounded-lg transition-colors whitespace-nowrap ${
          status === 'loading' ? 'bg-amber-600/50 cursor-wait' :
          status === 'success' ? 'bg-green-600 cursor-default' :
          'bg-amber-600 hover:bg-amber-500'
        }`}
      >
        {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
      </button>
    </form>
  );
}