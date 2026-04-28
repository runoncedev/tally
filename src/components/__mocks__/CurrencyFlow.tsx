export function CurrencyFlow({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)}
    </span>
  );
}
