import { GraduationCap } from "lucide-react";
import { ReportCard } from "../ReportCard";
import { DistanceRow } from "../DistanceRow";
import type { SchoolsInformation } from "@/lib/types";

export function SchoolsCard({ data }: { data: SchoolsInformation }) {
  return (
    <ReportCard icon={GraduationCap} title="Schools">
      <div>
        <DistanceRow
          label="Nearest Elementary School"
          distanceMiles={data.nearestElementarySchool.distanceMiles}
        />
        <DistanceRow label="Special Education Information" comingSoon />
      </div>
      <p className="mt-4">Special education information coming soon.</p>
    </ReportCard>
  );
}
