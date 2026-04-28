import NumberFlow from "@number-flow/react";

type Props = {
  value: number;
  className?: string;
};

export function CurrencyFlow({ value, className }: Props) {
  return (
    <NumberFlow
      value={value}
      format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      locales="en-US"
      className={className}
    />
  );
}
