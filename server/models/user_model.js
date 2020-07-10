require("dotenv").config();
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { ALPHAVANTAGE_API_KEY } = process.env;
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
            provider: "native",
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
        return {accessToken, loginAt, user};
    } catch (error) {
        await rollback();
        return {error};
    }
};

const nativeSignIn = async (email, password, expire) => {
    try {
        await transaction();
        const users = await query("SELECT * FROM user WHERE email = ?", [email]);
        const user = users[0];
        if (users.length == 0) {
            await commit();
            return {error: "Please sign up first"};
        } 
        if (CryptoJS.AES.decrypt(user.password, email).toString(CryptoJS.enc.Utf8) !== password){
            await commit();
            return {error: "Password is wrong"};
        }
        const loginAt = new Date();
        const sha = crypto.createHash("sha256");
        sha.update(email + password + loginAt);
        const accessToken = sha.digest("hex");
        const queryStr = "UPDATE user SET access_token = ?, access_expired = ?, last_login = ? WHERE id = ?";
        await query(queryStr, [accessToken, expire, loginAt, user.id]);
        await commit();
        return {accessToken, loginAt, user};
    } catch (error) {
        await rollback();
        return {error};
    }
};



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

const getWatchlist = async function (id, io) {
    async function getData() {
        const selectStr = "SELECT watchlist FROM user WHERE id = ?";
        const result = await query(selectStr, id);
        let results = [];
        if (result[0].watchlist === null) {
            results = {error: "You haven't created your watchlist yet"};
        } else {
            let watchlist = result[0].watchlist.split(",");
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
        }
        io.emit("watchlist", results);
    }
    getData();
    setInterval(() => getData(), 20000);
};

const getOrders = async function (id) {
    const selectStr = "SELECT symbol, price, volume, success, deadline  FROM orders WHERE user_id = ? ORDER BY success";
    const results = await query(selectStr, id);
    if (results.length === 0) {
        return {error: "You haven't created any orders yet"};
    } else {
        const now = new Date();
        const history = results.filter(i => i.success === 1);
        const orders = results.filter(i => i.success === 0 && i.deadline >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0));
        history.forEach(i => {
            delete i.success;
            delete i.deadline;
        });
        orders.forEach(i => {
            delete i.success;
            i.deadline = i.deadline.toISOString().substr(0, 10);
        });
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
    }
};

module.exports = {
    signUp,
    nativeSignIn,
    addRemoveWatchlist,
    getWatchlist,
    getOrders
};