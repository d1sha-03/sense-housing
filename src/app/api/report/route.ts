import { NextRequest, NextResponse } from "next/server";
import { buildAccessibilityReport } from "@/lib/report";
import { GeocodingError } from "@/lib/geocoding";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address.trim() : "";

  if (!address) {
    return NextResponse.json({ error: "An address is required." }, { status: 400 });
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
