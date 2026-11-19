import { Character, createCharacter } from './characters';
import { effectiveMaxPlayers, gameConfig } from './config';
import { face, sequenceRng } from './testUtils';

const createParty = (count: number, rng = Math.random): Character[] =>
  Array.from({ length: count }).reduce<Character[]>(
    (party, _, i) => [...party, createCharacter(`Player ${i + 1}`, party, rng)],
    [],
  );

describe('createCharacter', () => {
  it('creates a character with a name, toy, tool, ability and mood from config', () => {
    const character = createCharacter('  Alice ', [], Math.random);
    expect(character.name).toBe('Alice');
    expect(character.id).toBe('character-1');
    expect(gameConfig.toys.map((t) => t.name)).toContain(character.toy);
    expect(gameConfig.tools.map((t) => t.name)).toContain(character.tool);
    expect(gameConfig.abilities).toContainEqual(character.ability);
    expect(character.mood).toBeGreaterThanOrEqual(2);
    expect(character.mood).toBeLessThanOrEqual(12);
  });

  it('rolls mood with two dice', () => {
    const character = createCharacter('Bob', [], sequenceRng(0, 0, 0, face(4), face(6)));
    expect(character.mood).toBe(10);
  });

  it('never gives two characters the same toy, tool or ability', () => {
    for (let run = 0; run < 50; run += 1) {
      const party = createParty(effectiveMaxPlayers(gameConfig));
      expect(new Set(party.map((c) => c.toy)).size).toBe(party.length);
      expect(new Set(party.map((c) => c.tool)).size).toBe(party.length);
      expect(new Set(party.map((c) => c.ability.name)).size).toBe(party.length);
      expect(new Set(party.map((c) => c.id)).size).toBe(party.length);
    }
  });

  it('only picks from items that are still unused', () => {
    const first = createCharacter('A', [], () => 0);
    const second = createCharacter('B', [first], () => 0);
    expect(second.toy).toBe(gameConfig.toys[1].name);
    expect(second.tool).toBe(gameConfig.tools[1].name);
    expect(second.ability).toEqual(gameConfig.abilities[1]);
  });

  it('requires a name', () => {
    expect(() => createCharacter('   ', [], Math.random)).toThrow();
  });

  it('throws when the config has run out of unique items', () => {
    const config = { ...gameConfig, toys: [{ name: 'Teddy' }] };
    const first = createCharacter('A', [], Math.random, config);
    expect(() => createCharacter('B', [first], Math.random, config)).toThrow(/No unused toys/);
  });
});
