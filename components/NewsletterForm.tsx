'use client';
import { useState } from 'react';

// Simple Buttondown embed form.
// Set NEXT_PUBLIC_BUTTONDOWN_USERNAME in your env, e.g. 'zwiedzajchytrze'
export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const username = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME || 'twoj-newsletter';
  const action = `https://buttondown.email/api/emails/embed-subscribe/${username}`;

  return (
    <div className="w-full max-w-xl rounded-2xl border p-4 md:p-6">
      <form
        action={action}
        method="post"
        target="popupwindow"
        onSubmit={() => setStatus('loading')}
      >
        <div className={compact ? "flex gap-2" : "space-y-3"}>
          <input
            type="email"
            name="email"
            required
            placeholder="Twój e‑mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />
          <input type="hidden" name="tag" value="newsletter" />
          <button
            type="submit"
            className="rounded-xl px-5 py-3 font-medium shadow hover:shadow-md"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Zapisywanie…' : 'Zapisz się'}
          </button>
        </div>
        {!compact && (
          <p className="mt-2 text-sm opacity-70">
            Zapisując się, akceptujesz przetwarzanie danych zgodnie z naszą{' '}
            <a className="underline" href="/polityka-prywatnosci">polityką prywatności</a>.
          </p>
        )}
      </form>
      {status === 'success' && <p className="mt-3 text-sm text-green-700">Dziękujemy! Sprawdź skrzynkę.</p>}
      {status === 'error' && <p className="mt-3 text-sm text-red-700">Coś poszło nie tak. Spróbuj ponownie.</p>}
    </div>
  );
}
