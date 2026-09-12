import { GraduationCap } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { DistanceRow } from "../DistanceRow";
import type { SchoolsInformation } from "@/lib/types";

export function SchoolsCard({ data }: { data: SchoolsInformation }) {
  return (
    <ReportCard icon={GraduationCap} title="Schools">
      <div>
        <DistanceRow
          label="Elementary School"
          distanceMiles={data.nearestElementarySchool.distanceMiles}
          detail={data.nearestElementarySchool.name ?? undefined}
          status={data.nearestElementarySchool.status}
        />
        <DistanceRow
          label="Middle School"
          distanceMiles={data.nearestMiddleSchool.distanceMiles}
          detail={data.nearestMiddleSchool.name ?? undefined}
          status={data.nearestMiddleSchool.status}
        />
        <DistanceRow
          label="High School"
          distanceMiles={data.nearestHighSchool.distanceMiles}
          detail={data.nearestHighSchool.name ?? undefined}
          status={data.nearestHighSchool.status}
        />
        <DistanceRow label="Special Education Information" status="coming_soon" />
      </div>
      <p className="mt-4">Special education information coming soon.</p>
    </ReportCard>
  );
}
