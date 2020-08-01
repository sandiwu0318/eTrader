require("dotenv").config();
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { FINNHUB_API_KEY } = process.env;
const axios = require("axios");
const _ = require("lodash");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const signUp = async (name, email, password, expire) => {
    try {
        await transaction();
        const emails = await query("SELECT email FROM user WHERE email = ? FOR UPDATE", [email]);
        if (emails.length > 0){
            await commit();
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
            picture: null,
            access_token: accessToken,
            access_expired: expire,
            last_login: loginAt
        };
        const queryStr = "INSERT INTO user SET ?";
        const result = await query(queryStr, user);
        user.id = result.insertId;
        await commit();
        delete user.password;
        delete user.access_expired;
        delete user.access_token;
        delete user.last_login;
        return {accessToken, loginAt, user};
    } catch (error) {
        await rollback();
        return {error};
    }
};

const signIn = async (email, password) => {
    try {
        await transaction();
        const users = await query("SELECT * FROM user WHERE email = ?", [email]);
        const user = users[0];
        const accessToken = users[0].access_token;
        if (users.length == 0) {
            await commit();
            return {error: "Please sign up first"};
        }
        if (CryptoJS.AES.decrypt(user.password, email).toString(CryptoJS.enc.Utf8) !== password){
            await commit();
            return {error: "Password is wrong"};
        }
        const loginAt = new Date();
        const queryStr = "UPDATE user SET last_login = ? WHERE id = ?";
        await query(queryStr, [loginAt, user.id]);
        delete user.password;
        delete user.access_expired;
        delete user.access_token;
        delete user.last_login;
        await commit();
        return {accessToken, loginAt, user};
    } catch (error) {
        await rollback();
        return {error};
    }
};



const addRemoveWatchlist = async function (token, symbol) {
    try {
        const selectStr = "SELECT id, watchlist FROM user WHERE access_token = ?";
        const result = await query(selectStr, token);
        if (result.length === 0) {
            return {error: "Wrong authentication"};
        }
        let watchlist;
        if (result[0].watchlist === null || result[0].watchlist === "") {
            watchlist = [];
        } else {
            watchlist = result[0].watchlist.split(",");
        }
        if (watchlist.indexOf(symbol) !== -1) {
            watchlist = watchlist.filter(i => i !== symbol);
        } else {
            watchlist.push(symbol);
        }
        const watchlistStr = watchlist.join(",");
        await transaction();
        const updateStr = "UPDATE user SET watchlist = ? WHERE id = ?";
        await query(updateStr, [watchlistStr, result[0].id]);
        await commit();
        return {watchlist: watchlistStr};
    } catch(error) {
        await rollback();
        return {error};
    }
};

const getWatchlist = async function (token, symbolOnly) {
    const selectStr = "SELECT watchlist FROM user WHERE access_token = ?";
    const result = await query(selectStr, token);
    if (result.length === 0) {
        return {error: "Wrong authentication"};
    }
    let results = [];
    if (result[0].watchlist === null) {
        return {error: "You don't have any watchlist yet"};
    } else {
        if (symbolOnly === 1) {
            return result;
        }
        let watchlist = result[0].watchlist.split(",");
        if (watchlist.length === 1 && watchlist[0] === "") {
            return {error: "You don't have any watchlist yet"};
        }
        for (let i of watchlist) {
            const current = (await axios.get(`https://finnhub.io/api/v1/quote?symbol=${i}&token=${FINNHUB_API_KEY}`)).data;
            if (current === undefined) {
                return {error: "Please wait for a bit"};
            }
            const result = {
                symbol: i,
                "opening price": current["o"],
                "high price": current["h"],
                "low price": current["l"],
                "current price": current["c"],
                "previous closing price": current["pc"],
                "%": `${((current["c"] / current["pc"] -1)*100).toFixed(2)}%`,
            };
            results.push(result);
        }
    }
    return results;
};

const getOrders = async function (token) {
    const getIdStr = "SELECT id FROM user WHERE access_token = ?";
    const result = (await query(getIdStr, token));
    if (result.length === 0) {
        return {error: "Wrong authentication"};
    }
    const id = result[0].id;
    const selectStr = "SELECT * FROM orders WHERE user_id = ? ORDER BY success, created_date DESC, symbol";
    const results = await query(selectStr, id);
    if (results.length === 0) {
        return {error: "You haven't created any orders yet"};
    }
    const now = new Date();
    const history = results.filter(i => i.success === 1);
    const orders = results.filter(i => i.success === 0 && i.deadline >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0));
    history.forEach(i => {
        delete i.success;
    });
    history.filter(i => i.sub_action === "buy" || i.sub_action === "short").forEach(i => {
        i.investmentReturn = - i.volume * i.price;
    });
    history.filter(i => i.sub_action === "sell" || i.sub_action === "short cover").forEach(i => {
        i.investmentReturn = i.volume * i.price;
    });
    orders.forEach(i => {
        delete i.success;
        delete i.action;
        i.deadline = i.deadline.toISOString().substr(0, 10);
    });
    console.log(orders);
    return {
        history: history,
        orders: orders,
    };
};

const getPortfolios = async function (token) {
    const getIdStr = "SELECT id FROM user WHERE access_token = ?";
    const result = (await query(getIdStr, token));
    if (result.length === 0) {
        return {error: "Wrong authentication"};
    }
    const id = result[0].id;
    const selectStr = "SELECT symbol, action, sub_action, price, volume FROM orders WHERE user_id = ? and success = 1";
    const results = await query(selectStr, id);
    if (results.length === 0) {
        return {error: "You don't have any portfolios yet"};
    }
    results.forEach(i => {
        if (i.sub_action === "buy" || i.sub_action === "short") {
            i.multiple = i.price * i.volume;
        } else {
            i.multiple = - i.price * i.volume;
            i.volume = -i.volume;
        }
    });
    const portfolioList = _.groupBy(results, "symbol");
    let portfolio = [];
    Object.values(portfolioList).forEach(i => {
        const group = _.groupBy(i, "action");
        Object.values(group).forEach(j => {
            const volume = _.sumBy(j, "volume");
            const averagePrice = _.sumBy(j, "multiple")/volume;
            const data = {
                symbol: j[0].symbol,
                action: j[0].action,
                volume: volume,
                price: averagePrice
            };
            portfolio.push(data);
        });
    });
    for (let i of portfolio) {
        const current = (await axios.get(`https://finnhub.io/api/v1/quote?symbol=${i.symbol}&token=${FINNHUB_API_KEY}`)).data;
        if (current === undefined) {
            return {error: "Please wait for a bit"};
        }
        i.current = current["c"];
        i.changePercent = (i.current - i.price) / i.price;
    }
    return portfolio;
};


module.exports = {
    signUp,
    signIn,
    addRemoveWatchlist,
    getWatchlist,
    getOrders,
    getPortfolios
};