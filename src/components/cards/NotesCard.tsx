import { Info } from "lucide-react";
import { ReportCard } from "../ReportCard";

export function NotesCard({ disclaimer }: { disclaimer: string }) {
  return (
    <ReportCard icon={Info} title="Sense Notes">
      <p>{disclaimer}</p>
    </ReportCard>
  );
}
