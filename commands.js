import 'dotenv/config';

const ROUND_COMMAND = {
  name: 'round',
  description: 'Check the current round',
  type: 1,
};

const SET_ROUND_COMMAND = {
  name: 'set_round',
  description: 'Set the current round',
  type: 1,
};

const PING_COMMAND = {
  name: 'ping',
  description: 'Ping everyone for the drink',
  options: [
    {
      type: 3,
      name: 'info',
      description: 'Any relevant info to add?',
      required: true
    }
  ],
  type: 1,
};

const GUESS_STATUS_COMMAND = {
  name: 'guess_status',
  description: 'Get the status on your current guess',
  type: 1,
}

const GUESS_DRINK_COMMAND = {
  name: 'guess',
  description: 'Used by drink guessers to guess the drink',
  options: [
    {
      type: 3,
      name: 'drink',
      description: 'Drink to guess',
      required: true
    }
  ],
  type: 1
};

const INSPECT_GUESSES_COMMAND = {
  name: 'inspect_guesses',
  description: 'Used by drink revelear to know who guessed correctly',
  type: 1
};

const LEADERBOARD_COMMAND = {
  name: 'leaderboard',
  description: 'Gets the leaderboard on who has the most wins',
  type: 1
};

const REVEAL_DRINK_COMMAND = {
  name: 'reveal',
  description: 'Used by drink revealer to reveal the drink',
  options: [
    {
      type: 3,
      name: 'reveal',
      description: 'Drink to reveal',
      required: true
    },
    {
      type: 3,
      name: 'message',
      description: 'Custom message to attach to the reveal -- Do not use bold or ** in your message.',
      required: true
    }
  ],
  type: 1
};

const HELP_COMMAND = {
  name: 'help',
  description: 'Help for those who need it'
}

export const ALL_COMMANDS = [ROUND_COMMAND, SET_ROUND_COMMAND, HELP_COMMAND, PING_COMMAND, INSPECT_GUESSES_COMMAND, LEADERBOARD_COMMAND, GUESS_STATUS_COMMAND, REVEAL_DRINK_COMMAND, GUESS_DRINK_COMMAND];