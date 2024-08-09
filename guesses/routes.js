import * as dao from "./dao.js";

export default class GuessRoutes {
    createGuess = async (guess) => {
        try {
            await dao.createGuess(guess);
        } catch (err) {
            console.log(err);
            return
        }
    }

    getAllGuessesOnRound = async (roundNumber) => {
        try {
            return await dao.getAllGuessesOnRound(roundNumber);
        } catch (err) {
            console.log(err);
            return
        }
    }

    getAllCorrectGuesses = async () => {
        try {
            return await dao.findAllCorrect();
        } catch (err) {
            console.log(err);
            return
        }
    }

    updateGuess = async (guess, user, roundNumber) => {
        try {
            return await dao.updateGuess(guess, user, roundNumber);
        } catch (err) {
            console.log(err);
            return
        }
    }

    updateCorrect = async (user, roundNumber) => {
        try {
            return await dao.updateCorrect(user, roundNumber);
        } catch (err) {
            console.log(err);
            return
        }
    }

    updateIncorrect = async (user, roundNumber) => {
        try {
            return await dao.updateIncorrect(user, roundNumber);
        } catch (err) {
            console.log(err);
            return
        }
    }

    getGuess = async (guess) => {
        try {
            const response = await dao.findByGuess(guess);
            return response;
        } catch (err) {
            console.log(err);
            return
        }
    }

    getUserGuess = async (user, roundNumber) => {
        try {
            const response = await dao.findUserGuess(user, roundNumber);
            return response;
        } catch (err) {
            console.log(err);
            return
        }
    }
}