import { MapPinned } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { DistanceRow } from "../DistanceRow";
import type { NeighborhoodAccessInformation } from "@/lib/types";

export function AccessCard({ data }: { data: NeighborhoodAccessInformation }) {
  return (
    <ReportCard icon={MapPinned} title="Neighborhood Access">
      <div>
        <DistanceRow
          label="Hospital"
          distanceMiles={data.hospital.distanceMiles}
          detail={data.hospital.name ?? undefined}
          status={data.hospital.status}
        />
        <DistanceRow
          label="Park"
          distanceMiles={data.park.distanceMiles}
          detail={data.park.name ?? undefined}
          status={data.park.status}
        />
        <DistanceRow
          label="Pharmacy"
          distanceMiles={data.pharmacy.distanceMiles}
          detail={data.pharmacy.name ?? undefined}
          status={data.pharmacy.status}
        />
        <DistanceRow
          label="Transit Stop"
          distanceMiles={data.transitStop.distanceMiles}
          detail={data.transitStop.name ?? undefined}
          status={data.transitStop.status}
        />
        <DistanceRow
          label="Grocery Store"
          distanceMiles={data.groceryStore.distanceMiles}
          detail={data.groceryStore.name ?? undefined}
          status={data.groceryStore.status}
        />
        <DistanceRow
          label="Gas Station"
          distanceMiles={data.gasStation.distanceMiles}
          detail={data.gasStation.name ?? undefined}
          status={data.gasStation.status}
        />
      </div>
      <p className="mt-4">{data.summary}</p>
    </ReportCard>
  );
}
