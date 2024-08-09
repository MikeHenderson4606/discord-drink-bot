import * as dao from "./dao.js";

export default class DrinkRoutes {
    createDrink = async (drink) => {
        try {
            await dao.createDrink(drink);
        } catch (err) {
            console.log(err);
            return
        }
    }
}