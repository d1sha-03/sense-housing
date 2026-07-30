import { TrainFront } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { RiskBadge } from "../RiskBadge";
import { DistanceRow } from "../DistanceRow";
import type { NoiseInformation } from "@/lib/types";

export function NoiseCard({ data }: { data: NoiseInformation }) {
  return (
    <ReportCard icon={TrainFront} title="Noise Environment" badge={<RiskBadge risk={data.risk} />}>
      <div>
        <DistanceRow label="Train Tracks" distanceMiles={data.nearestTrainTracks.distanceMiles} />
        <DistanceRow label="Highway" distanceMiles={data.nearestHighway.distanceMiles} />
        <DistanceRow label="Airport" distanceMiles={data.nearestAirport.distanceMiles} />
      </div>
      <p className="mt-4">{data.summary}</p>
    </ReportCard>
  );
}
