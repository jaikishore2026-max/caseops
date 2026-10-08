type BrandMarkProps = {
  compact?: boolean;
};

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className={`brand-mark${compact ? " brand-mark--compact" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
