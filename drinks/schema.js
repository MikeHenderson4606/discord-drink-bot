import mongoose from "mongoose";

const drinkSchema = new mongoose.Schema({
    user: {type: String, required: true},
    username: {type: String, required: true},
    drink: {type: String, required: true},
    roundNumber: {type: Number, required: true, unique: true}
}, {collection: "drinks"});

export default drinkSchema;