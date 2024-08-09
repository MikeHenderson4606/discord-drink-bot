import mongoose from "mongoose";
import drinkSchema from "./schema.js";

const model = mongoose.model("DrinkModel", drinkSchema);

export default model;