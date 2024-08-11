import model from "./model.js";

export const incrementRound = (roundNumber) => model.updateOne({_id: "66b8194e11bba4c62f09514f"}, {round_number: roundNumber});
export const getGameState = () => model.findOne({_id: "66b8194e11bba4c62f09514f"});
export const changeGuessPhase = (guessPhase) => model.updateOne({_id: "66b8194e11bba4c62f09514f"}, { guess_phase: guessPhase });