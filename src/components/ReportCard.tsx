import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface ReportCardProps {
  icon: LucideIcon;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function ReportCard({ icon: Icon, title, badge, children }: ReportCardProps) {
  return (
    <div className="group rounded-2xl border border-border-subtle bg-surface p-6 shadow-[var(--shadow-soft)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-hover)] sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
            <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="mt-5 text-sm leading-relaxed text-foreground/70">{children}</div>
    </div>
  );
}
