const hashValue = (value: string) => [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 9973, 17);

export function authorColor(userId: string) {
  const hash = hashValue(userId || "connect");
  const h1 = hash % 360;
  const h2 = (h1 + 58 + (hash % 45)) % 360;
  const h3 = (h1 + 132 + (hash % 70)) % 360;
  return `linear-gradient(180deg, hsl(${h1} 72% 60%), hsl(${h2} 68% 56%), hsl(${h3} 76% 52%))`;
}
