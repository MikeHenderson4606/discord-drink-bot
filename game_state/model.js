import mongoose from "mongoose";
import gameStateSchema from "./schema.js";

const model = mongoose.model("GameStateModel", gameStateSchema);

export default model;