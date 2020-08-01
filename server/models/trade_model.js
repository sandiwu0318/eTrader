require("dotenv").config();
const { FINNHUB_API_KEY } = process.env;
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const BB = require("technicalindicators").BollingerBands;
const axios = require("axios");
const _ = require("lodash");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const setOrder = async function (token, symbol, category, value, indicatorPeriod, cross, volume, action, sub_action, period) {
    try {
        if (category === "price") {
            indicatorPeriod = null;
        }
        const now = new Date();
        let deadline;
        switch (period) {
        case "1 day":
            deadline = new Date(now.getTime()+1000*60*60*24);
            break;
        case "90 days":
            deadline = new Date(now.getTime()+1000*60*60*24*90);
            break;
        }
        const selectIdStr = "SELECT id FROM user WHERE access_token = ?";
        const result = await query(selectIdStr, token);
        const user_id = result[0].id;
        const title = `${category}`;
        let order = {
            user_id: user_id,
            symbol: symbol,
            volume: volume,
            action: action,
            sub_action: sub_action,
            indicatorPeriod: indicatorPeriod,
            cross: cross,
            deadline: deadline,
            success: 0,
            created_date: new Date()
        };
        if (title.substr(1, 2) === "MA") {
            order["MA"] = `${JSON.stringify(value)}`;
        } else {
            order[title] = value;
        }
        order["category"] = title;
        const queryStr = "INSERT INTO orders SET ?";
        await transaction();
        await query(queryStr, order);
        await commit();
        return {message: "The order placed! You can check the result in History and Orders now."};
    } catch(error) {
        console.log(error);
        await rollback();
        return {error};
    }
};

const matchPriceOrders = async function () {
    try {
        const today = new Date();
        const queryStr = "SELECT * FROM orders WHERE deadline >= ? and success = 0 and price IS NOT NULL";
        const orders = await query(queryStr, new Date(today.getTime()));
        if (orders.length === 0) {
            return;
        }
        for (let order of orders) {
            let newOrder;
            const selectOrdersStr = "SELECT * FROM orders WHERE user_id = ? AND symbol = ? AND action = ? AND success = 1";
            const OrderResult = await query(selectOrdersStr, [order.user_id, order.symbol, order.action]);
            switch(order.sub_action){
            case "sell": {
                const buyVolume = OrderResult.filter(i => i.sub_action === "buy").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = OrderResult.filter(i => i.sub_action === "sell").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    newOrder = order;
                }
                break;
            }
            case "short cover": {
                const buyVolume = OrderResult.filter(i => i.sub_action === "short").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = OrderResult.filter(i => i.sub_action === "short cover").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    newOrder = order;
                }
                break;
            }
            case "buy": {
                newOrder = order;
                break;
            }
            case "short": {
                newOrder = order;
                break;
            }
            }
            if (newOrder) {
                const symbol = newOrder.symbol;
                const markets = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
                const marketPrice = markets.data["c"];
                if (newOrder.price >= marketPrice) {
                    await transaction();
                    const queryStr = "UPDATE orders SET price = ?, success = 1, success_date = ? WHERE id = ?";
                    await query(queryStr, [marketPrice, today, newOrder.id]);
                    await commit();
                }
            }
        }
        return;
    } catch(error) {
        await rollback();
        return {error};
    }
};

const matchIndicatorOrders = async function () {
    try {
        const today = new Date();
        const queryStr = "SELECT * FROM orders WHERE deadline >= ? and success = 0 and price IS NULL";
        const orders = await query(queryStr, new Date(today.getTime()));
        if (orders.length === 0) {
            return;
        }
        for (let order of orders) {
            let newOrder;
            const selectOrdersStr = "SELECT * FROM orders WHERE user_id = ? AND symbol = ? AND action = ? AND success = 1";
            const OrderResult = await query(selectOrdersStr, [order.user_id, order.symbol, order.action]);
            switch(order.sub_action){
            case "sell": {
                const buyVolume = OrderResult.filter(i => i.sub_action === "buy").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = OrderResult.filter(i => i.sub_action === "sell").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    newOrder = order;
                }
                break;
            }
            case "short cover": {
                const buyVolume = OrderResult.filter(i => i.sub_action === "short").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = OrderResult.filter(i => i.sub_action === "short cover").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    newOrder = order;
                }
                break;
            }
            case "buy": {
                newOrder = order;
                break;
            }
            case "short": {
                newOrder = order;
                break;
            }
            }
            if (newOrder) {
                const symbol = newOrder.symbol;
                const indicatorPeriod = newOrder.indicatorPeriod;
                const selectStr = "SELECT DISTINCT(time), price FROM stock_price WHERE symbol = ? ORDER BY time DESC LIMIT ?";
                let results;
                if (newOrder.category.substr(1, 2) === "MA") {
                    const period = _.max([JSON.parse(newOrder.MA)[0]+2, JSON.parse(newOrder.MA)[1]+2]);
                    results = await query(selectStr, [symbol, period]);
                } else {
                    results = await query(selectStr, [symbol, indicatorPeriod+2]);
                }
                if (results.length === 0) {
                    return;
                }
                let calculateInput = {
                    values: results.map(i => i.price),
                    period: indicatorPeriod
                };
                let calculateInput1;
                let calculateInput2;
                let calculateValue1;
                let calculateValue2;
                let arr;
                if (newOrder.category.substr(1, 2) === "MA") {
                    calculateInput1 = {
                        values: results.map(i => i.price),
                        period: JSON.parse(newOrder.MA)[0]
                    };
                    calculateInput2 = {
                        values: results.map(i => i.price),
                        period: JSON.parse(newOrder.MA)[1]
                    };
                }
            
                let crossInput;
                switch(newOrder.category) {
                case "RSI": {
                    const calculateValue = RSI.calculate(calculateInput);
                    crossInput = {
                        lineA: calculateValue,
                        lineB: new Array(calculateValue.length).fill(newOrder.RSI)
                    };
                    break;
                }
                case "BB": {
                    calculateInput.stdDev = 2;
                    const calculateValue = BB.calculate(calculateInput).map(i => i[newOrder.BBline]);
                    crossInput = {
                        lineA: results.slice(0-calculateValue.length).map(i => i.price),
                        lineB: calculateValue,
                    };
                    break;
                }
                case "SMA": {
                    calculateValue1 = SMA.calculate(calculateInput1);
                    calculateValue2 = SMA.calculate(calculateInput2);
                    break;
                }
                case "EMA": {
                    calculateValue1 = EMA.calculate(calculateInput1);
                    calculateValue2 = EMA.calculate(calculateInput2);
                    break;
                }
                case "WMA": {
                    calculateValue1 = WMA.calculate(calculateInput1);
                    calculateValue2 = WMA.calculate(calculateInput2);
                    break;
                }
                }
                if (newOrder.category.substr(1, 2) === "MA") {
                    arr = new Array(Math.abs(calculateValue1.length-calculateValue2.length)).fill(0);
                    if (calculateValue1.length > calculateValue2.length) {
                        crossInput = {
                            lineA: calculateValue1,
                            lineB: arr.concat(calculateValue2)
                        };
                    } else {
                        crossInput = {
                            lineA: calculateValue1,
                            lineB: arr.concat(calculateValue2)
                        };
                    }
                }
                let crossArr = [];
                switch(newOrder.cross) {
                case "crossup": {
                    crossArr = CrossUp.calculate(crossInput);
                    break;
                }
                case "crossdown": {
                    crossArr = CrossDown.calculate(crossInput);
                    break;
                }
                }
                if (crossArr[crossArr.length-1] === true) {
                    await transaction();
                    const queryStr = "UPDATE orders SET price = ?, success = 1, success_date = ? WHERE id = ?";
                    await query(queryStr, [results[results.length-1].price, today, newOrder.id]);
                    await commit();
                }
            }
        }
        return;
    } catch(error) {
        await rollback();
        return {error};
    }
};

const deleteOrder = async function (id) {
    try {
        const deleteStr = "DELETE FROM orders WHERE id = ?";
        await transaction();
        await query(deleteStr, id);
        await commit();
        return {message: "success"};
    } catch(error) {
        await rollback();
        return {error};
    }
};



module.exports = {
    setOrder,
    matchPriceOrders,
    matchIndicatorOrders,
    deleteOrder
};