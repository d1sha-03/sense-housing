const MIN_LENGTH = 4;
const MAX_LENGTH = 200;

/**
 * Lightweight sanity checks for a free-text address before it's sent to the
 * geocoder. Not a full address parser — just enough to reject empty,
 * too-short, too-long, or clearly non-address input (e.g. all digits or
 * symbols) before spending a network round-trip on it. Shared by the
 * client-side SearchBar and the /api/report route so both enforce the same
 * rule set.
 */
export function validateAddress(address: string): string | null {
  const trimmed = address.trim();

  if (!trimmed) {
    return "Please enter an address.";
  }
  if (trimmed.length < MIN_LENGTH) {
    return "That address looks too short — please enter a full address.";
  }
  if (trimmed.length > MAX_LENGTH) {
    return "That address is too long.";
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return "Please enter a valid address, including a street or place name.";
  }

  return null;
}
