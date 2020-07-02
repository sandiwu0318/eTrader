require("dotenv").config();
const { ALPHAVANTAGE_API_KEY } = process.env;
const axios = require("axios");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const addRemoveWatchlist = async function (id, symbol) {
    try {
        await transaction();
        const selectStr = "SELECT watchlist FROM user WHERE id = ?";
        const result = await query(selectStr, id);
        let watchlist = result[0].watchlist.split(",");
        if (watchlist[0] === "") {
            watchlist = [];
        }
        if (watchlist.indexOf(symbol) !== -1) {
            watchlist = watchlist.filter(i => i!==symbol);
        } else {
            watchlist.push(symbol);
        }
        const watchlistStr = watchlist.join(",");
        const updateStr = "UPDATE user SET watchlist = ? WHERE id = ?";
        await query(updateStr, [watchlistStr, id]);
        await commit();
        return;
    } catch(error) {
        await rollback();
        return {error};
    }
};

const getWatchlist = async function (id) {
    try {
        await transaction();
        const selectStr = "SELECT watchlist FROM user WHERE id = ?";
        const result = await query(selectStr, id);
        await commit();
        let watchlist = result[0].watchlist.split(",");
        let results = [];
        for (let i of watchlist) {
            const current = (await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${i}&apikey=${ALPHAVANTAGE_API_KEY}`)).data["Global Quote"];
            const result = {
                symbol: current["01. symbol"],
                price: current["05. price"],
                volume: current["06. volume"],
                change: current["09. change"],
                changePercent: current["10. change percent"],
            };
            results.push(result);
        }
        return results;
    } catch(error) {
        await rollback();
        return {error};
    }
};

const getOrders = async function (id) {
    try {
        await transaction();
        const selectStr = "SELECT * FROM orders WHERE user_id = ? ORDER BY success";
        const orders = await query(selectStr, id);
        await commit();
        return orders;
    } catch(error) {
        await rollback();
        return {error};
    }
};

module.exports = {
    addRemoveWatchlist,
    getWatchlist,
    getOrders
};