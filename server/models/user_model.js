require("dotenv").config();
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { FINNHUB_API_KEY } = process.env;
const axios = require("axios");
const _ = require("lodash");
const {query} = require("../../utils/mysqlcon.js");
const {formatedDate} = require("../../utils/util.js");

const signUp = async (name, email, password) => {
    const emails = await query("SELECT email FROM user WHERE email = ? FOR UPDATE", [email]);
    if (emails.length > 0){
        return {error: "Email Already Exists"};
    }
    const loginAt = new Date();
    const sha = crypto.createHash("sha256");
    sha.update(email + password + loginAt);
    const accessToken = sha.digest("hex");
    const user = {
        email: email,
        password: CryptoJS.AES.encrypt(password, email).toString(),
        name: name,
        access_token: accessToken,
        last_login: loginAt
    };
    const insertStr = "INSERT INTO user SET ?";
    const result = await query(insertStr, user);
    user.id = result.insertId;
    delete user.password;
    delete user.access_token;
    delete user.last_login;
    return {accessToken, loginAt, user};
};

const signIn = async (email, password) => {
    const users = await query("SELECT * FROM user WHERE email = ?", [email]);
    const user = users[0];
    if (users.length === 0) {
        return {error: "Please sign up first"};
    }
    if (CryptoJS.AES.decrypt(user.password, email).toString(CryptoJS.enc.Utf8) !== password){
        return {error: "Password is wrong"};
    }
    const accessToken = users[0].access_token;
    const loginAt = new Date();
    const updateStr = "UPDATE user SET last_login = ? WHERE id = ?";
    await query(updateStr, [loginAt, user.id]);
    delete user.password;
    delete user.access_token;
    delete user.last_login;
    return {accessToken, loginAt, user};
};

const addToWatchlist = async function (token, symbol) {
    const selectStr = "SELECT id, watchlist FROM user WHERE access_token = ?";
    const databaseWatchlistData = await query(selectStr, token);
    if (databaseWatchlistData.length === 0) {
        return {error: "Wrong authentication"};
    }
    let watchlist = [];
    if (databaseWatchlistData[0].watchlist === null || databaseWatchlistData[0].watchlist === "") {
        watchlist = [];
    } else {
        watchlist = databaseWatchlistData[0].watchlist.split(",");
    }
    if (watchlist.indexOf(symbol) === -1) {
        watchlist.push(symbol);
        const watchlistStr = watchlist.join(",");
        const updateStr = "UPDATE user SET watchlist = ? WHERE id = ?";
        await query(updateStr, [watchlistStr, databaseWatchlistData[0].id]);
    }
    return {watchlist};
};

const removeFromWatchlist = async function (token, symbol) {
    const selectStr = "SELECT id, watchlist FROM user WHERE access_token = ?";
    const databaseWatchlistData = await query(selectStr, token);
    if (databaseWatchlistData.length === 0) {
        return {error: "Wrong authentication"};
    }
    let watchlist = [];
    if (databaseWatchlistData[0].watchlist === null || databaseWatchlistData[0].watchlist === "") {
        watchlist = [];
    } else {
        watchlist = databaseWatchlistData[0].watchlist.split(",");
    }
    if (watchlist.indexOf(symbol) !== -1) {
        watchlist = watchlist.filter(i => i !== symbol);
        const watchlistStr = watchlist.join(",");
        const updateStr = "UPDATE user SET watchlist = ? WHERE id = ?";
        await query(updateStr, [watchlistStr, databaseWatchlistData[0].id]);
    }
    return {watchlist};
};

const getWatchlist = async function (token, symbolOnly) {
    const selectStr = "SELECT watchlist FROM user WHERE access_token = ?";
    const databaseWatchlist = await query(selectStr, token);
    if (databaseWatchlist.length === 0) {
        return {error: "Wrong authentication"};
    }
    let watchlistData = [];
    if (databaseWatchlist[0].watchlist === null) {
        return {error: "You don't have any watchlist yet"};
    } else {
        if (symbolOnly === 1) {
            return databaseWatchlist;
        }
        let watchlistArr = databaseWatchlist[0].watchlist.split(",");
        if (watchlistArr.length === 1 && watchlistArr[0] === "") {
            return {error: "You don't have any watchlist yet"};
        }
        for (let i of watchlistArr) {
            const quote = (await axios.get(`https://finnhub.io/api/v1/quote?symbol=${i}&token=${FINNHUB_API_KEY}`)).data;
            const watchlistSingleData = {
                symbol: i,
                "opening price": quote["o"],
                "high price": quote["h"],
                "low price": quote["l"],
                "current price": quote["c"],
                "previous closing price": quote["pc"],
                "%": `${((quote["c"] / quote["pc"] -1)*100).toFixed(2)}%`,
            };
            watchlistData.push(watchlistSingleData);
        }
    }
    return watchlistData;
};

const getOrders = async function (token) {
    const getIdStr = "SELECT id FROM user WHERE access_token = ?";
    const databaseId = (await query(getIdStr, token));
    if (databaseId.length === 0) {
        return {error: "Wrong authentication"};
    }
    const id = databaseId[0].id;
    const selectStr = "SELECT * FROM orders WHERE user_id = ? ORDER BY success, created_date DESC, symbol";
    const databaseOrders = await query(selectStr, id);
    if (databaseOrders.length === 0) {
        return {error: "You haven't created any orders yet"};
    }
    const today = new Date();
    const history = databaseOrders.filter(i => i.success === 1);
    const orders = databaseOrders.filter(i => i.success === 0 && i.deadline >= new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0));
    history.forEach(function(i) {
        delete i.success;
        if (i.sub_action === "buy" || i.sub_action === "short") {
            i.investmentReturn = - i.volume * i.price;
        } else {
            i.investmentReturn = i.volume * i.price;
        }
    });
    orders.forEach(i => {
        delete i.success;
        delete i.action;
        i.deadline = formatedDate(i.deadline.toISOString());
    });
    return {
        history: history,
        orders: orders,
    };
};

const getPortfolios = async function (token) {
    const getIdStr = "SELECT id FROM user WHERE access_token = ?";
    const databaseId = (await query(getIdStr, token));
    if (databaseId.length === 0) {
        return {error: "Wrong authentication"};
    }
    const id = databaseId[0].id;
    const selectStr = "SELECT symbol, action, sub_action sub_action, price, volume, success_date FROM orders WHERE user_id = ? and success = 1 ORDER BY success_date";
    const databasePortfolios = await query(selectStr, id);
    if (databasePortfolios.length === 0) {
        return {error: "You don't have any portfolios yet"};
    }
    databasePortfolios.forEach(i => {
        if (i.sub_action === "buy" || i.sub_action === "short") {
            i.multiple = i.price * i.volume;
        } else {
            i.multiple = 0;
            i.volume = - i.volume;
        }
    });
    const groupBySymbol = _.groupBy(databasePortfolios, "symbol");
    let portfolios = [];
    Object.values(groupBySymbol).forEach(i => {
        const groupByAction = _.groupBy(i, "action");
        Object.values(groupByAction).forEach(j => {
            let aggreatedArr = [];
            const symbol = j[0].symbol;
            const action = j[0].action;
            while (j.findIndex(i => i.sub_action === "sell" || i.sub_action === "short cover") !== -1) {
                const firstExit = j.findIndex(i => i.sub_action === "sell" || i.sub_action === "short cover");
                const arrBeforeFirstExit = j.slice(0, firstExit);
                const arrIncludingFirstExit = j.slice(0, firstExit+1);
                const volumeSumBeforeFirstExit = _.sumBy(arrBeforeFirstExit, "volume");
                const averagePrice = _.sumBy(arrBeforeFirstExit, "multiple")/volumeSumBeforeFirstExit;
                const volume = _.sumBy(arrIncludingFirstExit, "volume");
                const aggreatedData = {
                    symbol: symbol,
                    action: action,
                    averagePrice: averagePrice,
                    volume: volume,
                    multiple: averagePrice * volume
                };
                aggreatedArr.push(aggreatedData);
                j.splice(0, firstExit+1);
            }
            const allData = aggreatedArr.concat(j);
            const totalVolume = _.sumBy(allData, "volume");
            const averagePrice = _.sumBy(allData, "multiple")/totalVolume;
            const portfolioData = {
                symbol: symbol,
                action: action,
                volume: totalVolume,
                price: averagePrice
            };
            portfolios.push(portfolioData);
        });
    });
    const portfolioWithVolume = portfolios.filter(i => i.volume !== 0);
    portfolioWithVolume.forEach(i => {
        i.index = portfolioWithVolume.indexOf(i);
    });
    const uniqueSymbols = _.uniq(portfolioWithVolume.map(i => i.symbol));
    
    for (let symbol of uniqueSymbols) {
        const current = (await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`)).data;
        let copiedPortfolio = [...portfolioWithVolume];
        while (copiedPortfolio.findIndex(j => j.symbol === symbol) !== -1) {
            const indexOfSymbol = copiedPortfolio.findIndex(j => j.symbol === symbol);
            const index = copiedPortfolio[indexOfSymbol].index;
            const indexOfValue = portfolioWithVolume[index];
            indexOfValue.current = current["c"];
            indexOfValue.changePercent = (current["c"] - indexOfValue.price) / indexOfValue.price;
            copiedPortfolio.splice(0, indexOfSymbol+1);
        }
    }
    portfolioWithVolume.forEach(i => {
        delete(i.index);
    });
    return portfolioWithVolume;
};


module.exports = {
    signUp,
    signIn,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
    getOrders,
    getPortfolios
};