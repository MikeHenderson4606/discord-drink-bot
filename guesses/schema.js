import mongoose from "mongoose";

const guessSchema = new mongoose.Schema({
    user: {type: String, required: true},
    username: {type: String, required: true},
    guess: {type: String, required: true},
    roundNumber: {type: Number, required: true},
    correct: {type: Boolean, required: true}
}, {collection: "guesses"});

export default guessSchema;