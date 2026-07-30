import { MapPinned } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { DistanceRow } from "../DistanceRow";
import type { NeighborhoodAccessInformation } from "@/lib/types";

export function AccessCard({ data }: { data: NeighborhoodAccessInformation }) {
  return (
    <ReportCard icon={MapPinned} title="Neighborhood Access">
      <div>
        <DistanceRow label="Hospital" distanceMiles={data.hospital.distanceMiles} />
        <DistanceRow label="Park" distanceMiles={data.park.distanceMiles} />
        <DistanceRow label="Pharmacy" distanceMiles={data.pharmacy.distanceMiles} />
        <DistanceRow label="Transit Stop" distanceMiles={data.transitStop.distanceMiles} />
      </div>
      <p className="mt-4">{data.summary}</p>
    </ReportCard>
  );
}
