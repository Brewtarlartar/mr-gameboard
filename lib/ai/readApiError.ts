export async function readApiError(response: Response): Promise<string> {
  // Routes that can explain themselves send { message }. Prefer it over a
  // bare status code, whatever the status.
  try {
    const body = await response.clone().json();
    if (body && typeof body.message === 'string' && body.message.length > 0) {
      return body.message;
    }
  } catch {
    // not JSON — fall through
  }
  if (response.status === 429) {
    const retry = response.headers.get('Retry-After');
    if (retry) return `The Tome must rest a moment. Try again in ${retry}s.`;
    return 'The Tome must rest a moment. Try again shortly.';
  }
  return `Request failed (${response.status})`;
}
