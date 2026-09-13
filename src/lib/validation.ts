const MIN_LENGTH = 4;
const MAX_LENGTH = 200;

// A real address only ever needs letters, digits, plain spaces, and a small
// set of punctuation (unit "#", abbreviations like "St.", hyphenated
// ranges, apostrophes for names like "O'Brien", comma-separated parts, and
// parentheses). Rejecting everything else up front — before this string
// reaches a downstream API query or gets rendered — blocks attempts to
// smuggle script tags, template/expression syntax, or other injection
// payloads through this field. Whitespace is restricted to the plain space
// character (not \s), so embedded newlines/tabs/control characters, which
// have no place in a single-line address, are rejected too.
const ALLOWED_ADDRESS_CHARS = /^[\p{L}\p{N} .,'#/&()-]+$/u;

export function hasValidAddressCharacters(address: string): boolean {
  return ALLOWED_ADDRESS_CHARS.test(address);
}

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
  if (!hasValidAddressCharacters(trimmed)) {
    return "Please remove special characters not typically found in an address.";
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return "Please enter a valid address, including a street or place name.";
  }

  return null;
}
