import { BACKEND_URL } from '@/constants/api';

const TIMEOUT_MS = 6000;

export async function checkAnswerSemantically(officialAnswer: string, guess: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_URL}/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officialAnswer, guess }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();
    return !!data.correct;
  } catch (err) {
    clearTimeout(timeoutId);
    return false;
  }
}