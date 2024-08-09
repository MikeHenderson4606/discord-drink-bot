import model from "./model.js";

export const createGuess = (guess) => model.create(guess);
export const findByGuess = (guess) => model.findOne({guess: guess});
export const findAllCorrect = (guess) => model.find({correct: true});
export const findUserGuess = (user, roundNumber) => model.findOne({user: user, roundNumber: roundNumber});
export const updateGuess = (guess, user, roundNumber) => model.findOneAndUpdate({user: user, roundNumber: roundNumber}, {guess: guess});
export const updateCorrect = (user, roundNumber) => model.findOneAndUpdate({user: user, roundNumber: roundNumber}, {correct: true});
export const updateIncorrect = (user, roundNumber) => model.findOneAndUpdate({user: user, roundNumber: roundNumber}, {correct: false});
export const getAllGuessesOnRound = (roundNumber) => model.find({roundNumber: roundNumber});