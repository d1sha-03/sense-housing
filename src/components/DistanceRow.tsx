import { ComingSoonBadge } from "./RiskBadge";

interface DistanceRowProps {
  label: string;
  distanceMiles?: number | null;
  detail?: string;
  comingSoon?: boolean;
}

export function DistanceRow({ label, distanceMiles, detail, comingSoon }: DistanceRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle/70 py-2.5 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {detail && <p className="text-xs text-foreground/50">{detail}</p>}
      </div>
      {comingSoon ? (
        <ComingSoonBadge />
      ) : (
        <span className="text-sm font-medium text-foreground/70">
          {distanceMiles != null ? `${distanceMiles} mi` : "—"}
        </span>
      )}
    </div>
  );
}
