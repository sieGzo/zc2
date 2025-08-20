'use client';
import { useState } from 'react';

export function useNewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(action: string) {
    setLoading(true); setMessage(null);
    try {
      const form = new FormData();
      form.append('email', email);
      form.append('tag', 'newsletter');
      await fetch(action, { method: 'POST', body: form, mode: 'no-cors' });
      setMessage('Dziękujemy! Sprawdź skrzynkę.');
    } catch (e) {
      setMessage('Ups! Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, loading, message, submit };
}
