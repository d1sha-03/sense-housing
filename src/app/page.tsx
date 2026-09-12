"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { SearchBar } from "@/components/SearchBar";
import { PropertyMap } from "@/components/PropertyMap";
import { NoiseCard } from "@/components/cards/NoiseCard";
import { HazardsCard } from "@/components/cards/HazardsCard";
import { AccessCard } from "@/components/cards/AccessCard";
import { SchoolsCard } from "@/components/cards/SchoolsCard";
import { NotesCard } from "@/components/cards/NotesCard";
import type { AccessibilityReport } from "@/lib/types";

type ViewState = "idle" | "loading" | "error";

export default function Home() {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(address: string) {
    setViewState("loading");
    setError(null);

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

      setReport(data);
      setViewState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setReport(null);
      setViewState("error");
    }
  }

  function handleReset() {
    setReport(null);
    setError(null);
    setViewState("idle");
  }

  const isLoading = viewState === "loading";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border-subtle/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <button onClick={handleReset} className="cursor-pointer">
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
              <SearchBar onSubmit={handleSearch} isLoading={isLoading} />
            </div>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
          </section>
        ) : (
          <section className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
            <div className="relative z-20 animate-fade-in">
              <SearchBar onSubmit={handleSearch} isLoading={isLoading} />
              {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            </div>

            <div className="mt-10 animate-fade-up">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
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
        <p className="mx-auto max-w-5xl px-6 text-center text-xs text-foreground/40">
          Sense uses publicly available geographic information. It is not a substitute for an
          in-person visit.
        </p>
      </footer>
    </div>
  );
}
