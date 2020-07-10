require("dotenv").config();
const { ALPHAVANTAGE_API_KEY } = process.env;
const axios = require("axios");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const setOrder = async function (id, symbol, price, volume, action, period) {
    try {
        const now = new Date();
        console.log(now);
        let deadline;
        switch (period) {
        case "1d":
            deadline = now;
            break;
        case "90d":
            deadline = new Date(now.getTime()+1000*60*60*24*90);
            break;
        }
        await transaction();
        const order = {
            user_id: id,
            symbol: symbol,
            price: price,
            volume: volume,
            action: action,
            deadline: deadline,
            success: 0
        };
        const queryStr = "INSERT INTO orders SET ?";
        await query(queryStr, order);
        await commit();
        return {message: "The order placed! You can check the result in History and Orders now."};
    } catch(error) {
        await rollback();
        return {error};
    }
};

const matchOrders = async function () {
    try {
        const today = (new Date()).toISOString().substr(0, 10);
        const queryStr = "SELECT * FROM orders WHERE deadline >= ? and success = 0";
        const orders = await query(queryStr, today);
        for (let order of orders) {
            const symbol = order.symbol;
            const markets = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHAVANTAGE_API_KEY}`);
            const marketPrice = markets.data["Global Quote"]["05. price"];
            console.log(order.price, marketPrice);
            if (order.price >= marketPrice) {
                await transaction();
                const queryStr = "UPDATE orders SET price = ?, success = 1 WHERE id = ?";
                await query(queryStr, [marketPrice, order.id]);
                await commit();
            }
        }
        return;
    } catch(error) {
        await rollback();
        return {error};
    }
};



module.exports = {
    setOrder,
    matchOrders,
};