export function resolveSocketUrl(
  configured: string | undefined,
  origin: string,
  protocol: string,
  hostname: string,
): string {
  if (configured) return configured;
  if (protocol === 'https:') return origin;
  return `http://${hostname}:9402`;
}
