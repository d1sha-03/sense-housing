import { Mountain } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { RiskBadge } from "../RiskBadge";
import { DistanceRow } from "../DistanceRow";
import type { NaturalHazardsInformation } from "@/lib/types";

export function HazardsCard({ data }: { data: NaturalHazardsInformation }) {
  return (
    <ReportCard icon={Mountain} title="Natural Hazards" badge={<RiskBadge risk={data.faultLine.risk} />}>
      <div>
        <DistanceRow
          label="Nearest Fault Line"
          distanceMiles={data.faultLine.distanceMiles}
          detail={data.faultLine.faultName ?? undefined}
        />
        <DistanceRow label="Flood Information" comingSoon />
        <DistanceRow label="Wildfire Information" comingSoon />
      </div>
      <p className="mt-4">
        Fault-line proximity is a general indicator of seismic activity in the area, not a
        building-specific risk assessment.
      </p>
    </ReportCard>
  );
}
