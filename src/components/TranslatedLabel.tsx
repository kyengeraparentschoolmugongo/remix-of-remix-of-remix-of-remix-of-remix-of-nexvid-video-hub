export function TranslatedLabel({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 px-0.5 text-[11px] font-semibold leading-tight text-primary">
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="truncate">{label}</span>
    </p>
  );
}
