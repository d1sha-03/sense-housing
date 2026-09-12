import { TrainFront } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { RiskBadge } from "../RiskBadge";
import { DistanceRow } from "../DistanceRow";
import type { NoiseInformation } from "@/lib/types";

export function NoiseCard({ data }: { data: NoiseInformation }) {
  return (
    <ReportCard icon={TrainFront} title="Noise Environment" badge={<RiskBadge risk={data.risk} />}>
      <div>
        <DistanceRow
          label="Train Tracks"
          distanceMiles={data.nearestTrainTracks.distanceMiles}
          detail={data.nearestTrainTracks.name ?? undefined}
          status={data.nearestTrainTracks.status}
        />
        <DistanceRow
          label="Highway"
          distanceMiles={data.nearestHighway.distanceMiles}
          detail={data.nearestHighway.name ?? undefined}
          status={data.nearestHighway.status}
        />
        <DistanceRow
          label="Airport"
          distanceMiles={data.nearestAirport.distanceMiles}
          detail={data.nearestAirport.name ?? undefined}
          status={data.nearestAirport.status}
        />
      </div>
      <p className="mt-4">{data.summary}</p>
    </ReportCard>
  );
}
