interface Props {
  onReset: () => void;
}

export const ResetButton = ({ onReset }: Props) => (
  <button
    type="button"
    onClick={() => {
      if (window.confirm('Reset the game? Everything in this game will be lost.')) onReset();
    }}
  >
    Reset game
  </button>
);
