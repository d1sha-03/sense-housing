export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 text-sm" : "h-9 w-9 text-base";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <div
        aria-hidden="true"
        className={`flex ${dims} items-center justify-center rounded-xl font-semibold text-white`}
        style={{ background: "linear-gradient(135deg, #1E3A8A, #14B8A6)" }}
      >
        S
      </div>
      <span className={`${textSize} font-semibold tracking-tight text-foreground`}>Sense</span>
    </div>
  );
}
