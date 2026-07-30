import type { Coordinates } from "./types";

/**
 * Deterministic pseudo-random generator seeded from coordinates, so mock
 * data is stable per-address instead of reshuffling on every render.
 */
export function seededRandom(coords: Coordinates, salt: string): number {
  const seed = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)},${salt}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

export function randomInRange(coords: Coordinates, salt: string, min: number, max: number): number {
  return min + seededRandom(coords, salt) * (max - min);
}
