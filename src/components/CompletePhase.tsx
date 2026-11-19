import { useMotion } from './ui/motion';

interface Props {
  onNewGame: () => void;
}

const CONFETTI = ['🎉', '⭐', '🎈', '✨', '🌟', '🎊'];
const CONFETTI_COUNT = 24;

export const CompletePhase = ({ onNewGame }: Props) => {
  const motion = useMotion();
  return (
    <section className="panel the-end">
      {motion && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
            <span
              key={i}
              className="confetti__piece"
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i * 173) % 1500}ms`,
                animationDuration: `${2500 + ((i * 251) % 1500)}ms`,
              }}
            >
              {CONFETTI[i % CONFETTI.length]}
            </span>
          ))}
        </div>
      )}
      <p className="the-end__trophy" aria-hidden="true">
        🏆
      </p>
      <h2>The End</h2>
      <p>The day is saved and the adventure is over.</p>
      <button type="button" className="btn btn--primary btn--big" onClick={onNewGame}>
        <span aria-hidden="true">🔁</span> New game
      </button>
    </section>
  );
};
