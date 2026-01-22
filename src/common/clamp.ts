export function Clamp(value: number, min = 0, max = 100) {
  const clamped = Math.min(max, Math.max(min, value));
  return clamped;
}
