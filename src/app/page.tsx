"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { SearchBar } from "@/components/SearchBar";
import { PropertyMap } from "@/components/PropertyMap";
import { NoiseCard } from "@/components/cards/NoiseCard";
import { HazardsCard } from "@/components/cards/HazardsCard";
import { AccessCard } from "@/components/cards/AccessCard";
import { SchoolsCard } from "@/components/cards/SchoolsCard";
import { NotesCard } from "@/components/cards/NotesCard";
import type { AccessibilityReport } from "@/lib/types";
import {
  clearLastViewed,
  normalizeAddressKey,
  readCache,
  readLastViewed,
  writeCache,
  writeLastViewed,
} from "@/lib/clientCache";
import { hasUnavailableData } from "@/lib/reportFreshness";

type ViewState = "idle" | "loading" | "error";

// Underlying sources (FEMA, USGS, NCES, Overpass) don't change fast enough
// to need fresher-than-a-day data, so a full report is safe to cache for 24h.
const REPORT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default function Home() {
  const [address, setAddress] = useState("");
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Restore whatever the user was last looking at after a hard refresh. Done
  // in an effect (not a lazy useState initializer) so the first client render
  // still matches the server-rendered empty-search markup and hydration
  // doesn't mismatch — this restore happens a tick later instead.
  useEffect(() => {
    const lastViewed = readLastViewed<AccessibilityReport>();
    if (lastViewed && !hasUnavailableData(lastViewed.report)) {
      // Deliberate one-time sync from localStorage (an external system) on
      // mount, not state derived from props/state — the pattern the
      // set-state-in-effect rule otherwise guards against.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddress(lastViewed.address);
      setReport(lastViewed.report);
    }
  }, []);

  async function handleSearch(address: string) {
    setAddress(address);
    setError(null);

    const cacheKey = `report:${normalizeAddressKey(address)}`;
    const cached = readCache<AccessibilityReport>(cacheKey);
    // A cached report where some data sources failed shouldn't be treated as
    // a hit — those failures are usually transient, so it's worth retrying
    // live rather than repeating the same gap for the rest of the TTL.
    if (cached && !hasUnavailableData(cached)) {
      setReport(cached);
      setViewState("idle");
      writeLastViewed(address, cached, REPORT_CACHE_TTL_MS);
      return;
    }

    setViewState("loading");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      if (!hasUnavailableData(data)) {
        writeCache(cacheKey, data, REPORT_CACHE_TTL_MS);
        writeLastViewed(address, data, REPORT_CACHE_TTL_MS);
      }
      setReport(data);
      setViewState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setReport(null);
      setViewState("error");
    }
  }

  function handleReset() {
    setAddress("");
    setReport(null);
    setError(null);
    setViewState("idle");
    clearLastViewed();
  }

  const isLoading = viewState === "loading";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border-subtle/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <button onClick={handleReset} aria-label="Reset and return to search" className="cursor-pointer">
            <Logo size="sm" />
          </button>
        </div>
      </header>

      <main className="flex-1">
        {!report ? (
          <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center sm:py-32">
            <div className="animate-fade-up">
              <Logo />
            </div>
            <h1 className="mt-8 animate-fade-up text-4xl font-semibold tracking-tight text-foreground sm:text-5xl [animation-delay:80ms]">
              Housing Accessibility Insights
            </h1>
            <p className="mt-5 max-w-lg animate-fade-up text-balance text-base leading-relaxed text-foreground/60 [animation-delay:160ms]">
              Helping families make more informed housing decisions through neighborhood
              accessibility information.
            </p>
            <div className="mt-10 w-full animate-fade-up [animation-delay:240ms]">
              <SearchBar value={address} onChange={setAddress} onSubmit={handleSearch} isLoading={isLoading} />
            </div>
            {error && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            )}
          </section>
        ) : (
          <section className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
            <div className="relative z-20 animate-fade-in">
              <SearchBar value={address} onChange={setAddress} onSubmit={handleSearch} isLoading={isLoading} />
              {error && (
                <p role="alert" className="mt-3 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-10 animate-fade-up">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Property Address
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
                {report.address.formattedAddress}
              </h2>
              <div className="mt-5">
                <PropertyMap coordinates={report.address} />
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
              <NoiseCard data={report.noise} />
              <HazardsCard data={report.naturalHazards} />
              <AccessCard data={report.neighborhoodAccess} />
              <SchoolsCard data={report.schools} />
              <div className="md:col-span-2">
                <NotesCard disclaimer={report.notes.disclaimer} />
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border-subtle/70 py-8">
        <p className="mx-auto max-w-5xl px-6 text-center text-xs text-foreground/60">
          Sense uses publicly available geographic information. It is not a substitute for an
          in-person visit.
        </p>
      </footer>
    </div>
  );
}
