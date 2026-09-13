import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { hasValidAddressCharacters } from "@/lib/validation";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const SUGGESTION_LIMIT = 5;
const MIN_QUERY_LENGTH = 3;
// Matches the address field's own cap (see validateAddress) — anything
// longer than this is never a real address and would only be forwarded to
// Nominatim to no purpose.
const MAX_QUERY_LENGTH = 200;
// Typeahead is debounced client-side at 300ms, so a real typing session
// tolerates a higher ceiling than the report endpoint.
const RATE_LIMIT = { windowMs: 10_000, max: 20 };
// Overfetch before filtering down to house-numbered results, since a chunk
// of raw matches (streets, neighborhoods, hamlets) get discarded below.
const FETCH_LIMIT = 15;

export interface AddressSuggestion {
  formattedAddress: string;
  lat: number;
  lng: number;
}

/**
 * Thin server-side proxy for Nominatim's search endpoint, used for address
 * typeahead. Kept server-side (rather than calling Nominatim directly from
 * the browser) so the required descriptive User-Agent header is always
 * present and so this app's own debouncing controls the request rate — not
 * whatever a client happens to send.
 */
export async function GET(request: NextRequest) {
  const { limited, retryAfterSeconds } = checkRateLimit(`suggest:${getClientIp(request)}`, RATE_LIMIT);
  if (limited) {
    return NextResponse.json(
      { suggestions: [] },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (
    query.length < MIN_QUERY_LENGTH ||
    query.length > MAX_QUERY_LENGTH ||
    !hasValidAddressCharacters(query)
  ) {
    // A query this endpoint won't serve suggestions for is treated the same
    // as any other miss (see the catch below) — this is a convenience
    // endpoint, not the place to explain why input was rejected.
    return NextResponse.json({ suggestions: [] });
  }

  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(FETCH_LIMIT));
  // This app's other data sources (FEMA, USGS, USFS, NCES) only cover the
  // US, so a US address is the only kind of result that's ever useful here.
  // Without these, Nominatim happily matches bare house/postal numbers
  // against places worldwide and returns their local-language name.
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("accept-language", "en");
  // Needed to inspect address.house_number below, which is how a specific
  // building/home address is distinguished from a street, neighborhood, or
  // hamlet match.
  url.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Sense-Housing-Accessibility-MVP/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const results = await response.json();
    if (!Array.isArray(results)) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions: AddressSuggestion[] = results
      // A `house_number` in the structured address is what distinguishes an
      // actual building/home address from a street, neighborhood, or hamlet
      // match (e.g. searching "35540 dee" also matches the hamlet "Dee,
      // Monterey County" with no number at all) — this app only wants the
      // former, since a report needs a specific point to evaluate.
      .filter((result) => result?.display_name && result?.lat && result?.lon && result?.address?.house_number)
      .slice(0, SUGGESTION_LIMIT)
      .map((result) => ({
        formattedAddress: result.display_name as string,
        lat: Number(result.lat),
        lng: Number(result.lon),
      }));

    return NextResponse.json({ suggestions });
  } catch {
    // Suggestions are a convenience — if Nominatim is slow, down, or
    // rate-limiting, fail quietly to an empty list rather than surfacing an
    // error for a feature the user can work around by just typing the
    // full address and hitting Analyze.
    return NextResponse.json({ suggestions: [] });
  }
}
