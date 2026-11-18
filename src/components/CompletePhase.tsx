interface Props {
  onNewGame: () => void;
}

export const CompletePhase = ({ onNewGame }: Props) => (
  <section>
    <h2>The End</h2>
    <p>The day is saved and the adventure is over.</p>
    <button type="button" onClick={onNewGame}>
      New game
    </button>
  </section>
);
