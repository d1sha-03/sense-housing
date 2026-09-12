import { NextRequest, NextResponse } from "next/server";
import { buildAccessibilityReport } from "@/lib/report";
import { GeocodingError } from "@/lib/geocoding";
import { validateAddress } from "@/lib/validation";

export async function POST(request: NextRequest) {
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
