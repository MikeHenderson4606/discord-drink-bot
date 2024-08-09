import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import GuessRoutes from './guesses/routes.js';
import axios from 'axios';
import {
  InteractionType,
  InteractionResponseType
} from 'discord-interactions';
import { VerifyDiscordRequest } from './utils.js';
import { ALL_COMMANDS } from './commands.js';
import { InstallGlobalCommands } from './utils.js';
import DrinkRoutes from './drinks/routes.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(session({secret: 'my-super-secret-key'}), express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

const API_BASE = 'https://discord.com/api/v9/';
const api = axios.create();

const connectionString = process.env.DB_CONNECTION_STRING || 'mongodb+srv://hendersonmi:kanbasapp@cluster0.c53kfow.mongodb.net/DrinkGuesser?retryWrites=true&w=majority';
mongoose.connect(connectionString);

const guessClient = new GuessRoutes();
const drinkClient = new DrinkRoutes();
var roundNumber = 1;
var hasPinged = false;
// Update these on the actual server
const revealerID = process.env.REVEALER_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_ID = process.env.ROLE_ID;

// Register all commands
InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions',  async function (req, res) {
  // Interaction type and data
  const { type, id, data, token } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // Check current round
    if (name === 'round') {
      const response = {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'The current round number is ' + roundNumber + '.',
        }
      }
      return res.send(response);
    }
    // Help menu displaying commands
    if (name === 'help') {
      const helpText = `**/help** -> Displays this menu **(Hidden to other players)** \n
                        **/ping** {info} -> Pings all guessers with any addditional info to help guess the drink **(Revealer only)** \n
                        **/guess** {drink} -> Submits a guess with the given drink **(can be overridden before the reveal, hidden to other players)** \n
                        **/guess_status** -> Gives the status on the drink you currently have guesssed **(Hidden to other players)** \n
                        **/inspect_guesses** -> Gives a table of all the current guesses **(Hidden to other players)** \n
                        **/reveal** {drink} {custom message} -> Reveals the drink with a custom message **(Revealer only)** \n
                        **/round** -> Gets the current round number \n
                        **/set_round** -> Sets the current round number **(Admin only)** \n
                        **/leaderboard** -> Displays the leaderboard \n
                      `;
      const response = {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: helpText,
          flags: 64
        }
      }
      return res.send(response);
    }
    // Set current round
    if (name === 'set_round') {
      try {
        const newRoundNumber = req.body.data.options[0].value.parseInt();
        const response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'The current round is now ' + newRoundNumber + '.',
          }
        }
        roundNumber = newRoundNumber;
        return res.send(response);
      } catch (err) {
        const response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Please input a value number.',
            flags: 64
          },
        }
        return res.send(response);
      }
    }
    // Ping everyone to guess
    if (name === 'ping') {
      const userId = req.body.member.user.id;
      if (userId !== revealerID) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'You must be the revealer to ping.',
            flags: 64
          }
        });
      }
      const info = req.body.data.options[0].value;
      const response = {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '<@&' + ROLE_ID + '> Everyone place your guesses now! \n **Additional info:** ' + info,
          allowed_mentions: {
            roles: [ROLE_ID] 
          }
        },
      }
      hasPinged = true;
      return res.send(response);
    }
    // Check the user's guess status
    if (name === 'guess_status') {
      const userId = req.body.member.user.id;
      const response = await guessClient.getUserGuess(userId, roundNumber);
      if (response) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Your current guess is **" + response.guess + "**.",
            flags: 64
          },
        })
      } else {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "You do not have a current guess.",
            flags: 64
          },
        });
      }
    }
    // Get the leaderboard
    if (name === 'leaderboard') {
      const correctGuesses = await guessClient.getAllCorrectGuesses();
      var leaderboard = [];
      for (let i = 0; i < correctGuesses.length; i++) {
        if (leaderboard.find((elem) => {return (elem.user === correctGuesses[i].user)})) {
          const index = leaderboard.findIndex((elem) => {return (elem.user === correctGuesses[i].user)});
          leaderboard[index].score += 1;
        } else {
          leaderboard.push({
            user: correctGuesses[i].user,
            username: correctGuesses[i].username,
            score: 1
          });
        }
      }
      const sortedBoard = leaderboard.sort((a, b) => {
        return b.score - a.score;
      });

      const fields = sortedBoard.map((entry, index) => ({
        name: `**${index + 1}**. <@${entry.user}>`,
        value: entry.score == 1 ? `${entry.score} win` : `${entry.score} wins`,
      }));

      const embed = {
        title: 'Leaderboard',
        color: 0x0099ff,
        fields: fields
      };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [embed],
          allowed_mentions: {
            users: sortedBoard.map(entry => entry.user),
          },
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 1,
                  label: 'Refresh',
                  custom_id: 'refresh'
                }
              ]
            }
          ]
        },
      });
    }
    // Input a guess
    if (name === 'guess') {
      if (!hasPinged) { // Ensure there has been a ping first
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'You must wait for the ping for this round.',
            flags: 64
          }
        });
      }
      // Get the guess information
      const userId = req.body.member.user.id;
      const username = req.body.member.user.username;
      const guess = req.body.data.options[0].value.toLowerCase();

      const guessFormat = {
        user: userId,
        username: username,
        guess: guess,
        roundNumber: roundNumber,
        correct: false
      };

      // See whether or not the user has already guessed
      const allCurrentGuesses = await guessClient.getAllGuessesOnRound(roundNumber);
      const ifAlreadyGuessed = allCurrentGuesses.find((guess) => {
        return (guess.user === userId)
      });

      // Handle it appropriately
      if (ifAlreadyGuessed) {
        guessClient.updateGuess(guess, ifAlreadyGuessed.user, roundNumber);
      } else {
        guessClient.createGuess(guessFormat);
      }

      // Let them know their guess and send a message
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'You have guessed **' + guess + '**.',
          flags: 64
        }
      });
      api.post(API_BASE + `channels/${CHANNEL_ID}/messages`, {
        content: '<@' + userId + '> has guessed',
        allowed_mentions: {
          users: [userId]
        },
      }, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
      });
    }
    // Gets a current list of guesses
    if (name === 'inspect_guesses') {
      const guesses = await guessClient.getAllGuessesOnRound(roundNumber);
      var guessFormat = '';
      var userList = [];
      for (let i = 0; i < guesses.length; i ++) {
        guessFormat += '<@' + guesses[i].user + "> : " + guesses[i].guess + '\n';
        userList.push(guesses[i].user)
      }
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: guessFormat,
          allowed_mentions: {
            users: userList
          },
          flags: 64
        }
      });
    }
    // Reveal the drink
    if (name === 'reveal') {
      if (!hasPinged) { // Ensure the there has been a ping first
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'You must ping before you can reveal.',
            flags: 64
          }
        });
      }
      const userId = req.body.member.user.id;
      const revealVal = req.body.data.options[0].value.toLowerCase();
      const customMessage = req.body.data.options[1].value;
      if (revealerID !== userId) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "You're not the revealer!",
            flags: 64
          },
        });
      }
      else {
        const response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Are you you sure you want to submit the reveal: **' + revealVal + '**? \n **Custom Message:** ' + customMessage,
            flags: 64,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 3,
                    label: 'Confirm',
                    custom_id: 'confirm'
                  },
                  {
                    type: 2,
                    style: 4,
                    label: 'Cancel',
                    custom_id: 'cancel'
                  }
                ]
              }
            ]
          }
        }
        return res.send(response);
      }
    }
  }
  // Handle message components
  else if (type === InteractionType.MESSAGE_COMPONENT) {
    if (data.custom_id === 'confirm') {
      // Logic to determine who if anyone got it correctly
      const splitString = req.body.message.content.split('**');
      const revealVal = splitString[1]
      const userId = req.body.member.user.id;
      const username = req.body.member.user.username;
      const guesses = await guessClient.getAllGuessesOnRound(roundNumber);
      const customMessage = splitString[4].trim();
      const correctGuesses = guesses.filter((guess) => {
        if (guess.guess === revealVal) {
          return guess;
        }
      });

      // Update the message to confirm the reveal
      await axios.post(`https://discord.com/api/v9/interactions/${id}/${token}/callback`, {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: 'You have revealed!',
          components: []
        }
      });

      // If there is at least one winner
      if (correctGuesses.length > 0) {
        var formattedString = '';
        var userIds = [];
        // Compile all the winners and create a string and userId list
        for (let i = 0; i < correctGuesses.length; i++) {
          if (i == correctGuesses.length - 1) {
            formattedString += '<@' + correctGuesses[i].user + '>';
          } else {
            formattedString += '<@' + correctGuesses[i].user + '>, ';
          }
          userIds.push(correctGuesses[i].user);
          await guessClient.updateCorrect(correctGuesses[i].user, roundNumber);
        }
      }
      // Create a new drink in the database
      const drink = {
        user: userId,
        username: username,
        drink: revealVal,
        roundNumber: roundNumber
      }
      drinkClient.createDrink(drink);
      // Post the confirmation message to the channel
      await api.post(API_BASE + `channels/${CHANNEL_ID}/messages`, {
        content: '<@&' + ROLE_ID + '> The drink has been revealed allmighty drink guessers! The round is now ' + (roundNumber + 1) + '.',
        allowed_mentions: {
          roles: [ROLE_ID]
        },
      }, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
      });
      // Post the custom message to the channel
      await api.post(API_BASE + `channels/${CHANNEL_ID}/messages`, {
        content: customMessage,
        allowed_mentions: {
          roles: [ROLE_ID]
        },
      }, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
      });
      roundNumber++;
      hasPinged = false;
    }
    if (data.custom_id === 'cancel') { // Cancel the reveal
      await axios.post(`https://discord.com/api/v9/interactions/${id}/${token}/callback`, {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: 'You have cancelled the reveal.',
          components: []
        }
      });
    }
    if (data.custom_id === 'refresh') {
      const correctGuesses = await guessClient.getAllCorrectGuesses();
      var leaderboard = [];
      for (let i = 0; i < correctGuesses.length; i++) {
        if (leaderboard.find((elem) => {return (elem.user === correctGuesses[i].user)})) {
          const index = leaderboard.findIndex((elem) => {return (elem.user === correctGuesses[i].user)});
          leaderboard[index].score += 1;
        } else {
          leaderboard.push({
            user: correctGuesses[i].user,
            username: correctGuesses[i].username,
            score: 1
          });
        }
      }
      const sortedBoard = leaderboard.sort((a, b) => {
        return b.score - a.score;
      });

      const fields = sortedBoard.map((entry, index) => ({
        name: `**${index + 1}**. <@${entry.user}>`,
        value: entry.score == 1 ? `${entry.score} win` : `${entry.score} wins`
      }));

      const embed = {
        title: 'Leaderboard',
        color: 0x0099ff,
        fields: fields
      };

      return res.send({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          embeds: [embed],
          allowed_mentions: {
            users: sortedBoard.map((user) => user.user)
          },
        },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
