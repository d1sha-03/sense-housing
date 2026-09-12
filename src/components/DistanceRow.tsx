import { ComingSoonBadge, UnavailableBadge } from "./RiskBadge";

interface DistanceRowProps {
  label: string;
  distanceMiles?: number | null;
  detail?: string;
  status?: "available" | "coming_soon" | "unavailable";
}

const UNAVAILABLE_DETAIL = "Live data temporarily unavailable — please try again in a moment.";

export function DistanceRow({ label, distanceMiles, detail, status = "available" }: DistanceRowProps) {
  const resolvedDetail = detail ?? (status === "unavailable" ? UNAVAILABLE_DETAIL : undefined);
  return (
    <div className="flex items-center justify-between border-b border-border-subtle/70 py-2.5 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {resolvedDetail && <p className="text-xs text-foreground/50">{resolvedDetail}</p>}
      </div>
      {status === "coming_soon" ? (
        <ComingSoonBadge />
      ) : status === "unavailable" ? (
        <UnavailableBadge />
      ) : (
        <span className="text-sm font-medium text-foreground/70">
          {distanceMiles != null ? `${distanceMiles} mi` : "—"}
        </span>
      )}
    </div>
  );
}
