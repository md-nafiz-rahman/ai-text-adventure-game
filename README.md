# AI Text Adventure Game

A React Native mobile app that generates complete, playable text adventure worlds from a short description or a random surprise using a multi-agent AI pipeline built on Claude Sonnet 5.

Type `go north`, `take the rusty key`, `solve keyboard`, or tap a suggested action instead. Every world is different, and every world is verified playable before you ever see it.

## What makes this different


- **A generator agent** builds each world (rooms, exits, items, puzzles, enemies) using Claude's structured tool-calling, guaranteeing the output matches an exact schema.
- **A deterministic validator** not AI simulates a full playthrough of the generated world before it's ever shown to a player, confirming every locked door has a real way to open it, every enemy has a genuinely obtainable weakness, and the objective is actually achievable.
- **A second, independent critic agent** reviews anything that passes validation, but purely for creative quality,  pacing, fairness, thematic consistency  with no visibility into the structural checks.
- **A self-correcting loop** feeds a failed attempt back to the generator along with the exact reason it failed, using Claude's own tool-result mechanism inside one continued conversation, escalating to a more directive correction if the same issue repeats. Up to 5 attempts. If none fully succeed, the player still receives the last structurally valid world rather than an error.

The backend for this pipeline lives in a separate repository: [ai-text-adventure-backend](https://github.com/md-nafiz-rahman/textadventure-backend).

## How to play

The game is entirely command-driven, type what you want to do, or tap a suggested action chip for the same effect.

| Command | What it does |
|---|---|
| `look` | Describe your current surroundings |
| `go <direction>` | Move to another room, e.g. `go north` |
| `take <item>` | Pick up an item |
| `inventory` | List what you're carrying |
| `examine <item/enemy>` | Get a closer look at something |
| `solve <answer>` | Attempt the puzzle in the current room |
| `hint` | Reveal the next hint for an unsolved puzzle |
| `fight <enemy>` | Attempt to defeat an enemy blocking your way |
| `save` | Store your current progress |
| `help` | List all available commands in-game |

Typing something outside this list still gets a response an in-character line generated live by AI, describing what happens without ever changing the actual game state or revealing a puzzle's answer.

Puzzle answers don't need to be exact. A genuine synonym or a small grammatical difference (e.g. "torch" for an official answer of "flashlight") is accepted; a misspelling of the correct word is not.

## Creating a new adventure

From the menu, open **New Game**. You can either:

- Describe a setting in your own words  anything from "a haunted lighthouse" to a detailed, multi-part scenario
- Tap **Surprise me (random)** for a fully AI-chosen theme

### Why generation takes a moment

A new world isn't a single API call, it's the full pipeline described above which is generation, mechanical validation, creative review, and potentially several correction rounds if something needs fixing. This usually takes anywhere from a few seconds to around a minute, occasionally longer for a particularly detailed or ambitious description. The loading screen shows live status updates from the actual pipeline (e.g. *"Reviewing puzzle design and pacing..."*) whenever they're available, alongside general progress messages the rest of the time.

## Saved Games

Progress is stored on-device. From the menu:

- **Continue** an in-progress adventure exactly where you left off
- **Play Again** a completed or failed adventure, restarting that same world from the beginning
- **Delete** any save permanently

## Settings

- **Light Theme** - switch the entire app between a dark and light appearance
- **Suggested Actions** - toggle the tappable quick-action chips above the text input on or off; typed commands always work regardless of this setting

## Tech stack

- **React Native / Expo** - mobile app, file-based routing via Expo Router
- **TypeScript** - a custom game engine and JSON world schema built from scratch, independent of any AI involvement
- **Node.js / Express** - backend hosting the AI generation pipeline, deployed on Render
- **Anthropic Claude Sonnet 5** - structured generation, independent critique, freeform narrative responses, and semantic puzzle-answer checking
- **AsyncStorage** - local save/load and settings persistence

## Running locally

```bash
npm install
npx expo start
```

Requires the companion backend running separately see [ai-text-adventure-backend](https://github.com/md-nafiz-rahman/textadventure-backend)) for setup instructions. Update `src/constants/api.ts` to point at your backend's URL (a local address for development, or the deployed Render URL for production).
