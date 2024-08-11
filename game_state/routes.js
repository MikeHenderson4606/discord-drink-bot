import * as dao from "./dao.js";

export default class GameStateRoutes {
    incrementRound = async (newRound) => {
        try {
            await dao.incrementRound(newRound);
        } catch (err) {
            console.log(err);
            return
        }
    }

    getGameState = async () => {
        try {
            return await dao.getGameState();
        } catch (err) {
            console.log(err);
            return
        }
    }

    changeGuessPhase = async (newGuessPhase) => {
        try {
            return await dao.changeGuessPhase(newGuessPhase);
        } catch (err) {
            console.log(err);
            return
        }
    }
}