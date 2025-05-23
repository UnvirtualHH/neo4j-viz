export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds} Sek.`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} Min.`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} Std.`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}
