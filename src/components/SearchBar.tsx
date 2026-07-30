"use client";

import { Search, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

interface SearchBarProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSubmit, isLoading }: SearchBarProps) {
  const [address, setAddress] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = address.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[var(--shadow-soft)] transition-shadow duration-300 focus-within:shadow-[var(--shadow-soft-hover)] sm:flex-row sm:items-center sm:p-2"
    >
      <div className="flex flex-1 items-center gap-3 px-3 py-2.5">
        <Search className="h-4.5 w-4.5 shrink-0 text-foreground/35" strokeWidth={2} />
        <input
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Enter an address..."
          className="w-full bg-transparent text-[15px] text-foreground placeholder:text-foreground/35 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !address.trim()}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          "Analyze"
        )}
      </button>
    </form>
  );
}
