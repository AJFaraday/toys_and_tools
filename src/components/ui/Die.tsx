// Which of the nine cells (3 x 3, left to right, top to bottom) hold a pip for each face.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface Props {
  value: number;
  rolling?: boolean;
}

export const Die = ({ value, rolling = false }: Props) => (
  <span className={`die${rolling ? ' die--rolling' : ''}`} aria-hidden="true">
    {Array.from({ length: 9 }, (_, i) => (
      <span key={i} className={PIPS[value]?.includes(i) ? 'die__pip' : 'die__blank'} />
    ))}
  </span>
);
