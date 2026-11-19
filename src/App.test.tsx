import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { gameConfig } from './game/config';
import { STORAGE_KEY } from './game/storage';
import { face } from './game/testUtils';

// A controllable rng: every call returns `rngValue`.
let rngValue = 0;
const rng = () => rngValue;

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

const choosePlayers = (count: number) =>
  fireEvent.change(screen.getByLabelText('Number of players'), { target: { value: String(count) } });

const createCharacters = (...names: string[]) =>
  names.forEach((name) => {
    fireEvent.change(screen.getByLabelText(/Name of character/), { target: { value: name } });
    click('Create character');
  });

const fillStoryInputs = () => {
  gameConfig.settingBlocks
    .flatMap((block) => block.options)
    .forEach(({ inputLabel }) => {
      const input = inputLabel && screen.queryByLabelText(inputLabel);
      if (input) fireEvent.change(input, { target: { value: 'badger' } });
    });
  const done = screen.queryByRole('button', { name: 'Done' });
  if (done) fireEvent.click(done);
};

const startAdventure = (...names: string[]) => {
  choosePlayers(names.length);
  click('Generate story');
  fillStoryInputs();
  click('Continue to character creation');
  createCharacters(...names);
  click('Start adventure');
};

const card = (name: string) => within(screen.getByRole('article', { name }));

beforeEach(() => {
  rngValue = 0;
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('setting phase', () => {
  it('generates the story intro from the config using the number of players', () => {
    render(<App rng={rng} />);
    choosePlayers(2);
    click('Generate story');

    expect(screen.getByTestId('story')).toHaveTextContent(
      "It was a hot summer's day, and two little children took a walk in the woods, " +
        'where they met a wise old woman, who wants to steal their toys.',
    );
    expect(screen.queryByRole('button', { name: 'Generate story' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Number of players')).not.toBeInTheDocument();
  });

  it('focuses the number of players when the game starts', () => {
    render(<App rng={rng} />);
    expect(screen.getByLabelText('Number of players')).toHaveFocus();
  });

  it('offers player counts from the config', () => {
    render(<App rng={rng} />);
    const options = within(screen.getByLabelText('Number of players')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(screen.getByLabelText('Number of players')).toHaveValue(String(gameConfig.rules.defaultPlayers));
  });

  it('asks any questions before revealing the story', () => {
    const meeting = gameConfig.settingBlocks.find((b) => b.id === 'meeting')!;
    const index = meeting.options.findIndex((o) => o.inputLabel);
    const label = meeting.options[index].inputLabel!;
    const answered = meeting.options[index].text.replace('{input}', 'badger');
    rngValue = index / meeting.options.length;
    render(<App rng={rng} />);
    click('Generate story');

    expect(screen.queryByText(meeting.leadIn, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue to character creation' })).not.toBeInTheDocument();
    const done = screen.getByRole('button', { name: 'Done' });
    expect(screen.getByLabelText(label)).toHaveFocus();
    expect(screen.queryByLabelText('Number of players')).not.toBeInTheDocument();
    expect(done).toBeDisabled();

    fireEvent.change(screen.getByLabelText(label), { target: { value: '  ' } });
    expect(done).toBeDisabled();

    fireEvent.change(screen.getByLabelText(label), { target: { value: ' badger ' } });
    expect(screen.queryByText(meeting.leadIn, { exact: false })).not.toBeInTheDocument();
    click('Done');

    expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
    expect(screen.getByTestId('story')).toHaveTextContent(`${meeting.leadIn} ${answered},`);
    expect(screen.getByRole('button', { name: 'Continue to character creation' })).toBeEnabled();
  });

  it('shows the story straight away when there are no questions', () => {
    render(<App rng={rng} />);
    click('Generate story');
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to character creation' })).toBeEnabled();
  });
});

describe('character creation', () => {
  it('creates the chosen number of characters with unique random items', () => {
    render(<App rng={Math.random} />);
    choosePlayers(3);
    click('Generate story');
    fillStoryInputs();
    click('Continue to character creation');

    expect(screen.getByRole('button', { name: 'Create character' })).toBeDisabled();
    createCharacters('Alice', 'Bob');
    expect(screen.queryByRole('button', { name: 'Start adventure' })).not.toBeInTheDocument();
    createCharacters('Cara');
    expect(screen.queryByLabelText(/Name of character/)).not.toBeInTheDocument();

    const toys = ['Alice', 'Bob', 'Cara'].map((name) => {
      expect(card(name).getByText('Mood')).toBeInTheDocument();
      return card(name).getAllByRole('definition')[0].textContent; // the first <dd> is the toy
    });
    expect(new Set(toys).size).toBe(3);
    expect(screen.getByRole('button', { name: 'Start adventure' })).toBeInTheDocument();
  });

  it('focuses the name field for each new character', () => {
    render(<App rng={rng} />);
    choosePlayers(2);
    click('Generate story');
    click('Continue to character creation');
    expect(screen.getByLabelText('Name of character 1 of 2')).toHaveFocus();

    fireEvent.change(screen.getByLabelText(/Name of character/), { target: { value: 'Alice' } });
    const create = screen.getByRole('button', { name: 'Create character' });
    create.focus(); // as a real click would
    fireEvent.click(create);
    expect(screen.getByLabelText('Name of character 2 of 2')).toHaveFocus();
  });

  it('fills in names from earlier games, which can be kept or changed', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App rng={rng} />);
    startAdventure('Alice', 'Bob');
    click('Reset game');

    choosePlayers(3);
    click('Generate story');
    fillStoryInputs();
    click('Continue to character creation');

    const first = screen.getByLabelText<HTMLInputElement>('Name of character 1 of 3');
    expect(first).toHaveValue('Alice');
    expect(first).toHaveFocus();
    expect([first.selectionStart, first.selectionEnd]).toEqual([0, 'Alice'.length]);
    userEvent.keyboard('{enter}');
    expect(screen.getByRole('article', { name: 'Alice' })).toBeInTheDocument();

    expect(screen.getByLabelText('Name of character 2 of 3')).toHaveValue('Bob');
    createCharacters('Bella');
    expect(screen.getByLabelText('Name of character 3 of 3')).toHaveValue('');
    createCharacters('Cara');
    click('Start adventure');
    for (let i = 1; i < gameConfig.chapters.length; i += 1) click('Next chapter');
    click('Finish adventure');
    click('New game');

    choosePlayers(3);
    click('Generate story');
    fillStoryInputs();
    click('Continue to character creation');
    expect(screen.getByLabelText('Name of character 1 of 3')).toHaveValue('Alice');
    createCharacters('Alice');
    expect(screen.getByLabelText('Name of character 2 of 3')).toHaveValue('Bella');
    createCharacters('Bella');
    expect(screen.getByLabelText('Name of character 3 of 3')).toHaveValue('Cara');
  });

  it('shows ability roll type and mood type', () => {
    render(<App rng={rng} />);
    choosePlayers(1);
    click('Generate story');
    click('Continue to character creation');
    createCharacters('Alice');

    expect(card('Alice').getByRole('img', { name: 'Teddy' })).toHaveTextContent('🧸');
    expect(card('Alice').getByRole('img', { name: 'Book' })).toHaveTextContent('📖');
    expect(card('Alice').getAllByRole('definition')[2]).toHaveTextContent('🐸Jump like a frog Toy');
    expect(card('Alice').getByText('2 (toys mood)')).toBeInTheDocument();
  });
});

describe('gameplay', () => {
  it('rolls toys and tools against the character mood', () => {
    render(<App rng={rng} />);
    startAdventure('Alice', 'Bob'); // both have mood 2

    rngValue = face(6);
    fireEvent.click(card('Alice').getByRole('button', { name: 'Roll Toys' }));
    expect(card('Alice').getByRole('status')).toHaveTextContent('Toys roll: 6 + 6 = 12 against mood 2 — Pass by 10');

    fireEvent.click(card('Alice').getByRole('button', { name: 'Roll Tools' }));
    expect(card('Alice').getByRole('status')).toHaveTextContent('Tools roll: 6 + 6 = 12 against mood 2 — Fail by 10');

    rngValue = 0;
    fireEvent.click(card('Bob').getByRole('button', { name: 'Roll Tools' }));
    expect(card('Bob').getByRole('status')).toHaveTextContent('Tools roll: 1 + 1 = 2 against mood 2 — Pass (exactly on mood)');
  });

  it('uses a special ability a limited number of times across the whole game', () => {
    render(<App rng={rng} />);
    startAdventure('Alice'); // Jump like a frog (Toy), mood 2
    const useAbility = () => card('Alice').getByRole('button', { name: 'Use Jump like a frog (Toys roll)' });
    expect(card('Alice').getByText('Special ability uses left: 2 of 2')).toBeInTheDocument();

    rngValue = face(6);
    fireEvent.click(useAbility());
    expect(card('Alice').getByRole('status')).toHaveTextContent(
      'Jump like a frog: Toys roll: 6 + 6 = 12 against mood 2 — Pass by 10',
    );
    expect(card('Alice').getByText('Special ability uses left: 1 of 2')).toBeInTheDocument();
    expect(card('Alice').getByText('Rolls left this chapter: 3 of 3')).toBeInTheDocument();

    click('Next chapter');
    expect(card('Alice').getByText('Special ability uses left: 1 of 2')).toBeInTheDocument();
    for (let i = 0; i < 3; i += 1) fireEvent.click(card('Alice').getByRole('button', { name: 'Roll Toys' }));
    expect(card('Alice').getByRole('button', { name: 'Roll Toys' })).toBeDisabled();
    expect(useAbility()).toBeEnabled();

    fireEvent.click(useAbility());
    expect(card('Alice').getByRole('status')).toHaveTextContent('Jump like a frog: Toys roll');
    expect(card('Alice').getByText('Special ability uses left: 0 of 2')).toBeInTheDocument();
    expect(useAbility()).toBeDisabled();
  });

  it('limits rolls per chapter and resets them when the chapter changes', () => {
    render(<App rng={rng} />);
    startAdventure('Alice', 'Bob');
    expect(screen.getByRole('heading', { name: 'Chapter 1 of 6: Set the scene' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous chapter' })).toBeDisabled();

    const roll = () => fireEvent.click(card('Alice').getByRole('button', { name: 'Roll Toys' }));
    roll();
    roll();
    expect(card('Alice').getByText('Rolls left this chapter: 1 of 3')).toBeInTheDocument();
    roll();
    expect(card('Alice').getByRole('button', { name: 'Roll Toys' })).toBeDisabled();
    expect(card('Alice').getByRole('button', { name: 'Roll Tools' })).toBeDisabled();
    expect(card('Bob').getByText('Rolls left this chapter: 3 of 3')).toBeInTheDocument();

    click('Next chapter');
    expect(screen.getByRole('heading', { name: 'Chapter 2 of 6: Meet the thing' })).toBeInTheDocument();
    expect(card('Alice').getByText('Rolls left this chapter: 3 of 3')).toBeInTheDocument();
    expect(card('Alice').getByRole('status')).toBeEmptyDOMElement();

    roll();
    click('Previous chapter');
    expect(screen.getByRole('heading', { name: 'Chapter 1 of 6: Set the scene' })).toBeInTheDocument();
    expect(card('Alice').getByText('Rolls left this chapter: 3 of 3')).toBeInTheDocument();
  });

  it('finishes the adventure after the last chapter and clears the saved game', () => {
    render(<App rng={rng} />);
    startAdventure('Alice');
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    for (let i = 1; i < gameConfig.chapters.length; i += 1) click('Next chapter');
    expect(screen.getByRole('heading', { name: 'Chapter 6 of 6: Save the day!' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next chapter' })).not.toBeInTheDocument();

    click('Finish adventure');
    expect(screen.getByRole('heading', { name: 'The End' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset game' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    click('New game');
    expect(screen.getByRole('button', { name: 'Generate story' })).toBeInTheDocument();
  });
});

describe('reset', () => {
  it('only resets after confirmation, and clears the saved game', () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App rng={rng} />);
    startAdventure('Alice');

    click('Reset game');
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByRole('article', { name: 'Alice' })).toBeInTheDocument();

    confirm.mockReturnValue(true);
    click('Reset game');
    expect(screen.queryByRole('article', { name: 'Alice' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate story' })).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('persistence', () => {
  it('restores a game in progress after a reload', () => {
    const { unmount } = render(<App rng={rng} />);
    startAdventure('Alice', 'Bob');
    click('Next chapter');
    fireEvent.click(card('Bob').getByRole('button', { name: 'Roll Toys' }));
    unmount();

    render(<App rng={rng} />);
    expect(screen.getByRole('heading', { name: 'Chapter 2 of 6: Meet the thing' })).toBeInTheDocument();
    expect(screen.getByText(/two little children/)).toBeInTheDocument();
    expect(card('Bob').getByText('Rolls left this chapter: 2 of 3')).toBeInTheDocument();
    expect(card('Bob').getByRole('status')).toHaveTextContent('Toys roll: 1 + 1 = 2');
  });
});

describe('keyboard', () => {
  const pressEnter = () => userEvent.keyboard('{enter}');

  it('moves through the whole game with Enter', () => {
    render(<App rng={rng} />);
    choosePlayers(1);

    pressEnter();
    expect(screen.getByText(/It was a/)).toBeInTheDocument();
    pressEnter();
    expect(screen.getByRole('heading', { name: 'Character creation' })).toBeInTheDocument();

    userEvent.type(screen.getByLabelText(/Name of character/), 'Alice{enter}');
    expect(screen.getByRole('article', { name: 'Alice' })).toBeInTheDocument();
    pressEnter();
    expect(screen.getByRole('heading', { name: /Chapter 1 of/ })).toBeInTheDocument();

    for (let i = 2; i <= gameConfig.chapters.length; i += 1) {
      pressEnter();
      expect(screen.getByRole('heading', { name: new RegExp(`Chapter ${i} of`) })).toBeInTheDocument();
    }
    pressEnter();
    expect(screen.getByRole('heading', { name: 'The End' })).toBeInTheDocument();
    pressEnter();
    expect(screen.getByRole('button', { name: 'Generate story' })).toBeInTheDocument();
  });

  it('answers story questions with Enter before moving on', () => {
    const meeting = gameConfig.settingBlocks.find((b) => b.id === 'meeting')!;
    const index = meeting.options.findIndex((o) => o.inputLabel);
    rngValue = index / meeting.options.length;
    render(<App rng={rng} />);

    pressEnter();
    expect(screen.queryByRole('heading', { name: 'Character creation' })).not.toBeInTheDocument();
    pressEnter(); // nothing to move on to until the question is answered
    expect(screen.getByLabelText(meeting.options[index].inputLabel!)).toHaveFocus();

    userEvent.type(screen.getByLabelText(meeting.options[index].inputLabel!), 'badger{enter}');
    expect(screen.getByText(/badger/)).toBeInTheDocument();
    pressEnter();
    expect(screen.getByRole('heading', { name: 'Character creation' })).toBeInTheDocument();
  });

  it('moves to the next chapter instead of clicking a focused button', () => {
    render(<App rng={rng} />);
    startAdventure('Alice');

    const rollToys = card('Alice').getByRole('button', { name: 'Roll Toys' });
    rollToys.focus();
    pressEnter();

    expect(screen.getByRole('heading', { name: /Chapter 2 of/ })).toBeInTheDocument();
    expect(card('Alice').getByText('Rolls left this chapter: 3 of 3')).toBeInTheDocument();
    expect(card('Alice').getByRole('status')).toBeEmptyDOMElement();
  });
});

describe('story dice', () => {
  const twist = gameConfig.chapters.findIndex((c) => c.actions.includes('StoryDice'));
  const toTwist = () => {
    for (let i = 0; i < twist; i += 1) click('Next chapter');
    expect(screen.getByRole('heading', { name: new RegExp(`Chapter ${twist + 1} of`) })).toBeInTheDocument();
  };
  const storyDice = () => screen.queryByTestId('story-dice');

  it('rolls as soon as the twist chapter starts, and only there', () => {
    render(<App rng={rng} />);
    startAdventure('Alice');
    expect(storyDice()).not.toBeInTheDocument();

    rngValue = 0.9999;
    toTwist();
    expect(storyDice()).toHaveTextContent(`Story dice: ${gameConfig.storyDice[gameConfig.storyDice.length - 1]}`);
    expect(screen.queryByRole('button', { name: /story dice/i })).not.toBeInTheDocument();

    click('Next chapter');
    expect(storyDice()).not.toBeInTheDocument();
  });

  it('keeps the same face when stepping back and forward, and after a reload', () => {
    const { unmount } = render(<App rng={rng} />);
    startAdventure('Alice');
    toTwist();
    const first = `Story dice: ${gameConfig.storyDice[0]}`;
    expect(storyDice()).toHaveTextContent(first);

    rngValue = 0.9999;
    click('Previous chapter');
    click('Next chapter');
    expect(storyDice()).toHaveTextContent(first);
    click('Next chapter');
    click('Previous chapter');
    expect(storyDice()).toHaveTextContent(first);

    unmount();
    render(<App rng={rng} />);
    expect(storyDice()).toHaveTextContent(first);
  });

  it('moves on with Enter as usual', () => {
    render(<App rng={rng} />);
    startAdventure('Alice');
    toTwist();
    userEvent.keyboard('{enter}');
    expect(screen.getByRole('heading', { name: new RegExp(`Chapter ${twist + 2} of`) })).toBeInTheDocument();
  });
});

describe('remembered player count', () => {
  it('starts new games and reloads with the last number of players', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const { unmount } = render(<App rng={rng} />);
    choosePlayers(4);
    unmount();

    render(<App rng={rng} />);
    expect(screen.getByLabelText('Number of players')).toHaveValue('4');
    choosePlayers(2);
    click('Generate story');
    fillStoryInputs();
    click('Continue to character creation');
    createCharacters('Alice', 'Bob');
    click('Reset game');
    expect(screen.getByLabelText('Number of players')).toHaveValue('2');

    startAdventure('Alice');
    for (let i = 1; i < gameConfig.chapters.length; i += 1) click('Next chapter');
    click('Finish adventure');
    click('New game');
    expect(screen.getByLabelText('Number of players')).toHaveValue('1');
  });
});

describe('animation', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  // Each step schedules the next after rendering, so keep going until nothing is left.
  const finishAnimations = () => {
    for (let i = 0; i < 100 && jest.getTimerCount() > 0; i += 1) act(() => jest.runOnlyPendingTimers());
  };

  it('is off when reduced motion is preferred', () => {
    render(<App rng={rng} />);
    startAdventure('Alice');
    fireEvent.click(card('Alice').getByRole('button', { name: 'Roll Toys' }));
    expect(card('Alice').getByRole('status')).toHaveTextContent('Toys roll: 1 + 1 = 2');
  });

  it('fades in a new story and new characters, but not after a reload', () => {
    const { unmount } = render(<App rng={rng} animate />);
    choosePlayers(1);
    click('Generate story');
    fillStoryInputs();
    expect(screen.getByText(/It was a/)).toHaveClass('reveal');
    click('Continue to character creation');
    createCharacters('Alice');
    expect(card('Alice').getByRole('heading', { name: 'Alice' })).toHaveClass('reveal');
    unmount();

    render(<App rng={rng} animate />);
    expect(card('Alice').getByRole('heading', { name: 'Alice' })).not.toHaveClass('reveal');
  });

  it('shows the roll result once the dice have settled, or straight away when tapped', () => {
    render(<App rng={rng} animate />);
    startAdventure('Alice');
    const roll = () => fireEvent.click(card('Alice').getByRole('button', { name: 'Roll Toys' }));

    roll();
    expect(card('Alice').getByRole('status')).toBeEmptyDOMElement();
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(card('Alice').getByRole('status')).toBeEmptyDOMElement();
    finishAnimations();
    expect(card('Alice').getByRole('status')).toHaveTextContent('Toys roll: 1 + 1 = 2 against mood 2 — Pass (exactly on mood)');

    roll();
    expect(card('Alice').getByRole('status')).toBeEmptyDOMElement();
    fireEvent.click(screen.getByTitle('Tap to skip'));
    expect(card('Alice').getByRole('status')).toHaveTextContent('Toys roll: 1 + 1 = 2');
  });

  it('does not replay a roll restored after a reload', () => {
    const { unmount } = render(<App rng={rng} animate />);
    startAdventure('Alice');
    fireEvent.click(card('Alice').getByRole('button', { name: 'Roll Toys' }));
    finishAnimations();
    unmount();

    render(<App rng={rng} animate />);
    expect(card('Alice').getByRole('status')).toHaveTextContent('Toys roll: 1 + 1 = 2');
  });

  it('flickers the story dice on its first roll only', () => {
    render(<App rng={rng} animate />);
    startAdventure('Alice');
    const twist = gameConfig.chapters.findIndex((c) => c.actions.includes('StoryDice'));
    for (let i = 0; i < twist; i += 1) click('Next chapter');

    expect(screen.getByTestId('story-dice')).toBeEmptyDOMElement();
    finishAnimations();
    expect(screen.getByTestId('story-dice')).toHaveTextContent(`Story dice: ${gameConfig.storyDice[0]}`);

    click('Previous chapter');
    click('Next chapter');
    expect(screen.getByTestId('story-dice')).toHaveTextContent(`Story dice: ${gameConfig.storyDice[0]}`);
  });
});
