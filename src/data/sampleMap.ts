import { GameMap } from '@/types/game';

export const sampleMap: GameMap = {
  title: 'The Forgotten Study',
  startRoomId: 'entrance',
  objective: {
    type: 'collectItems',
    target: ['treasure'],
  },
  rooms: [
    {
      id: 'entrance',
      description: 'You stand at the entrance of an old, forgotten study. Dust hangs in the air. A hallway leads north.',
      exits: [{ direction: 'north', roomId: 'hallway' }],
      items: [],
    },
    {
      id: 'hallway',
      description: 'A narrow hallway. A heavy wooden door blocks the way north into the study. An exit leads east to a garden, and south back to the entrance.',
      exits: [
        { direction: 'north', roomId: 'study', locked: true },
        { direction: 'south', roomId: 'entrance' },
        { direction: 'east', roomId: 'garden' },
      ],
      items: [],
      puzzle: {
        id: 'door_riddle',
        prompt: "Carved into the door: 'I have keys but no locks, I have space but no room, you can enter but can't go inside. What am I?'",
        answer: 'keyboard',
        hints: [
          'Think about something you use every day to type.',
          "It's often paired with a mouse and a screen.",
        ],
        onSolve: {
          message: 'The door creaks open, unlocking the way north.',
          unlocksExitDirection: 'north',
        },
      },
    },
    {
      id: 'garden',
      description: 'An overgrown garden. Something glints beneath the weeds.',
      exits: [{ direction: 'west', roomId: 'hallway' }],
      items: [
        {
          id: 'rusty_sword',
          name: 'rusty sword',
          description: 'An old but still sharp sword.',
          canTake: true,
        },
      ],
    },
    {
      id: 'study',
      description: 'Dusty bookshelves line the walls. A trapdoor in the floor leads down to a vault.',
      exits: [
        { direction: 'south', roomId: 'hallway' },
        { direction: 'down', roomId: 'vault', locked: true },
      ],
      items: [],
      enemy: {
        id: 'guard_dog',
        name: 'guard dog',
        introMessage: 'A snarling guard dog blocks the trapdoor!',
        defeatedByAnyOf: ['rusty_sword'],
        damage: 20,
        successMessage: 'You fend off the dog with the rusty sword. It whimpers away, and the trapdoor unlocks.',
        failMessage: 'The dog bites you! You need a weapon to fight it off.',
        onDefeat: {
          unlocksExitDirection: 'down',
        },
      },
    },
    {
      id: 'vault',
      description: 'A small vault. In the centre sits a glittering treasure chest.',
      exits: [{ direction: 'up', roomId: 'study' }],
      items: [
        {
          id: 'treasure',
          name: 'treasure chest',
          description: 'A chest full of gold coins.',
          canTake: true,
        },
      ],
    },
  ],
};