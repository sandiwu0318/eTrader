require("dotenv").config();
const { ALPHAVANTAGE_API_KEY } = process.env;
const axios = require("axios");
const _ = require("lodash");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const addRemoveWatchlist = async function (id, symbol) {
    try {
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
        await transaction();
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
    const selectStr = "SELECT watchlist FROM user WHERE id = ?";
    const result = await query(selectStr, id);
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
};

const getOrders = async function (id) {
    const selectStr = "SELECT * FROM orders WHERE user_id = ? ORDER BY success";
    const results = await query(selectStr, id);
    const history = results.filter(i => i.success === 1);
    const orders = results.filter(i => i.success === 0);
    const portfolioList = _.groupBy(history, "symbol");
    const symbols = Object.keys(portfolioList);
    const portfolio = symbols.map(i => ({
        symbol: i,
        volume: portfolioList[i].map(i => i.volume).reduce((a, b) =>  a+b, 0),
        averagePrice: (portfolioList[i].map(j => j.price*j.volume).reduce((a, b) => a+b, 0))/
            portfolioList[i].map(i => i.volume).reduce((a, b) =>  a+b, 0),
    }));
    return {
        history: history,
        orders: orders,
        portfolio: portfolio
    };
};

module.exports = {
    addRemoveWatchlist,
    getWatchlist,
    getOrders
};