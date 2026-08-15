export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ivory/80 backdrop-blur-sm">
      <div className="gold-ring-spinner" />
      <p className="font-display text-2xl text-charcoal italic">{message}</p>
    </div>
  );
}
