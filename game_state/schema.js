import mongoose from "mongoose";

const gameStateSchema = new mongoose.Schema({
    guess_phase: {type: Boolean, required: true},
    round_number: {type: Number, required: true}
}, {collection: "game_state"});

export default gameStateSchema;