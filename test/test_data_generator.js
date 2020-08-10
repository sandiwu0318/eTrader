require("dotenv").config();
const {NODE_ENV} = process.env;
const CryptoJS = require("crypto-js");
const {
    users,
    orders,
    backtestResults
} = require("./test_data");
const {query, end} = require("../utils/mysqlcon.js");

function _createTestUsers() {
    const encryped_users = users.map(user => {
        return {
            email: user.email,
            password: CryptoJS.AES.encrypt(user.password, user.email).toString(),
            name: user.name,
            access_token: user.access_token,
            last_login: user.last_login,
            watchlist: user.watchlist
        };
    });
    return query("INSERT INTO user (email, password, name, access_token, last_login, watchlist) VALUES ?", [encryped_users.map(x => Object.values(x))]);
}

function _createTestOrders() {
    return query("INSERT INTO orders (user_id, symbol, volume, action, sub_action, indicator, price, BB, RSI, deadline, success, created_date) VALUES ?", [orders.map(x => Object.values(x))]);
}

function _createTestBacktestResults() {
    return query("INSERT INTO backtest_result (user_id, periods, symbol, volume, action, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross, investmentReturn, ROI, created_date) VALUES ?", [backtestResults.map(x => Object.values(x))]);
}

function createTestData() {
    if (NODE_ENV !== "test") {
        console.log("Not in test env");
        return;
    }

    return _createTestUsers()
        .then(_createTestOrders)
        .then(_createTestBacktestResults)
        .catch(console.log);
}

function truncateTestData() {
    if (NODE_ENV !== "test") {
        console.log("Not in test env");
        return;
    }

    console.log("truncate fake data");
    const setForeignKey = (status) => {
        return query("SET FOREIGN_KEY_CHECKS = ?", status);
    };

    const truncateTable = (table) => {
        return query(`TRUNCATE TABLE ${table}`);
    };

    return setForeignKey(0)
        .then(truncateTable("user"))
        .then(truncateTable("orders"))
        .then(truncateTable("backtest_result"))
        .then(setForeignKey(1))
        .catch(console.log);
}

function closeConnection() {
    return end();
}

module.exports = {
    createTestData,
    truncateTestData,
    closeConnection,
};