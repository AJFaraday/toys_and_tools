interface Props {
  remaining: number;
  total: number;
  symbol?: string;
  label: string;
}

// Something you can count at a glance, with the exact words kept for screen readers.
export const Pips = ({ remaining, total, symbol, label }: Props) => (
  <span className="pips">
    <span className="visually-hidden">{label}</span>
    <span aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`pip${i < remaining ? '' : ' pip--used'}${symbol ? ' pip--symbol' : ''}`}>
          {symbol}
        </span>
      ))}
    </span>
  </span>
);
