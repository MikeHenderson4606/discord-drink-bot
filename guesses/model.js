import mongoose from "mongoose";
import guessSchema from "./schema.js";

const model = mongoose.model("GuessModel", guessSchema);

export default model;