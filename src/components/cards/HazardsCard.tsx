import { Mountain } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { RiskBadge, UnavailableBadge } from "../RiskBadge";
import { DistanceRow } from "../DistanceRow";
import type { HazardAssessment, NaturalHazardsInformation } from "@/lib/types";

function HazardRow({ assessment }: { assessment: HazardAssessment }) {
  if (assessment.status === "unavailable") {
    return (
      <div className="flex items-center justify-between border-b border-border-subtle/70 py-2.5 last:border-b-0 last:pb-0">
        <p className="text-sm font-medium text-foreground">{assessment.label}</p>
        <UnavailableBadge />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-border-subtle/70 py-2.5 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-foreground">{assessment.label}</p>
        {assessment.detail && <p className="text-xs text-foreground/65">{assessment.detail}</p>}
      </div>
      {assessment.risk && <RiskBadge risk={assessment.risk} />}
    </div>
  );
}

export function HazardsCard({ data }: { data: NaturalHazardsInformation }) {
  return (
    <ReportCard icon={Mountain} title="Natural Hazards" badge={<RiskBadge risk={data.faultLine.risk} />}>
      <div>
        <DistanceRow
          label="Nearest Fault Line"
          distanceMiles={data.faultLine.distanceMiles}
          detail={data.faultLine.faultName ?? undefined}
          status={data.faultLine.status}
        />
        <HazardRow assessment={data.flood} />
        <HazardRow assessment={data.wildfire} />
      </div>
      <p className="mt-4">
        Fault-line proximity is a general indicator of seismic activity in the area, not a
        building-specific risk assessment.
      </p>
    </ReportCard>
  );
}
