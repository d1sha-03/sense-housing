import type { RiskLevel } from "@/lib/types";

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-success-50 text-success-700",
  moderate: "bg-warning-50 text-warning-700",
  high: "bg-danger-50 text-danger-700",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${RISK_STYLES[risk]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {RISK_LABELS[risk]}
    </span>
  );
}

export function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground/65">
      Coming Soon
    </span>
  );
}

/** Shown when a real data integration was attempted but failed or has no
 * coverage for this location — distinct from a feature that's simply not
 * built yet (see ComingSoonBadge). */
export function UnavailableBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground/65">
      Data Unavailable
    </span>
  );
}
