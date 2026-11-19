# Toys and Tools

A web app for running *Toys and Tools*, an interactive storytelling RPG for children. The story is
told out loud; the app handles the setup and dice rolls.

Play it at https://ajfaraday.github.io/toys_and_tools/

## Playing

1. **Setting** – choose the number of players and generate the opening paragraph of the story.
   If the story needs a word (e.g. which talking animal), the players are asked first.
2. **Character creation** – enter each child's name. Their toy, tool and special ability are picked
   at random (no two characters share an item) and their mood is rolled with two dice (2–12).
   - Mood above 7 is a *tools* mood, below 7 a *toys* mood, and 7 is *neutral*.
3. **Gameplay** – the adventure runs through the chapters. Each character can roll **Toys** or
   **Tools** a limited number of times per chapter (resets when the chapter changes).
   - A **toys** roll passes if two dice total the character's mood **or more**.
   - A **tools** roll passes if two dice total the character's mood **or less**.
   - The result shows how far the roll passed or failed by, so the story can make it a big or
     small success or failure.
   - Each character can use their **special ability** a limited number of times in the whole
     game (2 by default). Using it makes a roll of the ability's type (Toys or Tools), which doesn't
     count towards that chapter's rolls.

Press **Enter** to move on to the next step or chapter (or to submit a name or answer while typing).
You can step back one chapter, and **Reset game** (with confirmation) starts over at any time.
The game in progress is saved in the browser, and cleared when the adventure ends or is reset.
Character names are remembered between games: each name field starts with the name last used for
that player, selected so you can press Enter to keep it or type to replace it.

## Changing the game content

All game content lives in JSON files in [`src/config`](src/config); no code changes are needed to
add or change options, and lists can be any length.

| File | Contents |
| --- | --- |
| `setting.json` | Story blocks in order. Each has a `leadIn` and a list of `options`. An option can be a string, or `{ "text": "a talking {input}", "inputLabel": "Which animal?" }` to ask the players for a word. `{count}` and `{children}` are replaced with the number of players. |
| `characters.json` | `toys`, `tools`, and `abilities` (each with a `name` and a `rollType` of `"toys"` or `"tools"`, showing which roll decides it). |
| `chapters.json` | Chapter names, in order. |
| `rules.json` | `minPlayers`, `maxPlayers`, `defaultPlayers`, `rollsPerChapter`, `abilityUsesPerGame` (special ability uses per character for the whole game; 2 if left out), `numberWords` used in the story, and the `childNoun`. |

The maximum number of players is also limited by the shortest of the toys, tools and abilities
lists, so every character can get unique items. The config is checked when the app starts and in
the tests (`src/game/config.test.ts`), which explain what's wrong if a file is invalid.

## Development

- `npm install` – install dependencies (run this first)
- `npm start` – run the app at http://localhost:3000
- `npm test` – run the tests (`CI=true npm test` to run once)
- `npm run build` – build for production

Game rules are plain TypeScript in [`src/game`](src/game); the UI is in
[`src/components`](src/components).

## Deployment

Every push to `main` runs the tests, builds the app and deploys it to GitHub Pages using
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). It can also be run by hand from the
repository's Actions tab. The `homepage` in `package.json` sets the path the build expects to be
served from.
