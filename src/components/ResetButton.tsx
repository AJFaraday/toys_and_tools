interface Props {
  onReset: () => void;
}

export const ResetButton = ({ onReset }: Props) => (
  <button
    type="button"
    className="btn btn--small btn--reset"
    onClick={() => {
      if (window.confirm('Reset the game? Everything in this game will be lost.')) onReset();
    }}
  >
    <span aria-hidden="true">↺</span> Reset game
  </button>
);
