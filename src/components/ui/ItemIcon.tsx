import { Item } from '../../game/config';

interface Props {
  name: string;
  items: readonly Item[];
}

// Shows a toy or tool as its emoji, named for screen readers; falls back to the name when there's no emoji.
export const ItemIcon = ({ name, items }: Props) => {
  const emoji = items.find((item) => item.name === name)?.emoji;
  if (!emoji) return <span className="item-name">{name}</span>;
  return (
    <span className="item-emoji" role="img" aria-label={name} title={name}>
      {emoji}
    </span>
  );
};
