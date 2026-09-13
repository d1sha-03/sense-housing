import { NextRequest, NextResponse } from "next/server";
import { buildAccessibilityReport } from "@/lib/report";
import { GeocodingError } from "@/lib/geocoding";
import { validateAddress } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// The only field this route accepts is a single address string capped at 200
// characters (see validateAddress), so a request body ever needs to be a few
// hundred bytes. Reject anything grossly larger up front.
const MAX_BODY_BYTES = 16_000;

// This is the expensive route — a single call fans out into ~20 requests
// across five third-party providers (Nominatim, two Overpass mirrors, FEMA,
// USGS, USFS, NCES), several of which cap external callers at ~1 req/sec.
// Unthrottled abuse here risks getting this app's own server IP banned
// upstream, not just running up cost.
const RATE_LIMIT = { windowMs: 60_000, max: 10 };

export async function POST(request: NextRequest) {
  const { limited, retryAfterSeconds } = checkRateLimit(`report:${getClientIp(request)}`, RATE_LIMIT);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address.trim() : "";

  const validationError = validateAddress(address);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const report = await buildAccessibilityReport(address);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof GeocodingError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while generating this report." },
      { status: 500 }
    );
  }
}
