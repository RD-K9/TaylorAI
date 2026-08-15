export function EditorialRule({ children }: { children?: React.ReactNode }) {
  return (
    <div className="editorial-rule my-6">
      <span className="editorial-rule-line" />
      {children && (
        <span className="tracking-label text-gold font-display text-base normal-case tracking-[0.3em]">
          {children}
        </span>
      )}
      <span className="editorial-rule-line" />
    </div>
  );
}
