require("dotenv").config();
const {FINNHUB_API_KEY} = process.env;
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const BB = require("technicalindicators").BollingerBands;
const axios = require("axios");
const _ = require("lodash");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const setOrder = async function (token, symbol, indicator, value, indicatorPeriod, cross, volume, action, sub_action, period) {
    try {
        if (indicator === "price" || indicator.substr(1, 2) === "MA" ) {
            indicatorPeriod = null;
        }
        const today = new Date();
        let deadline;
        switch (period) {
        case "1 day":
            deadline = new Date(today.getTime()+1000*60*60*24);
            break;
        case "90 days":
            deadline = new Date(today.getTime()+1000*60*60*24*90);
            break;
        }
        const selectIdStr = "SELECT id FROM user WHERE access_token = ?";
        const databaseId = await query(selectIdStr, token);
        const id = databaseId[0].id;
        const indicatorName = `${indicator}`;
        let order = {
            user_id: id,
            symbol: symbol,
            volume: volume,
            action: action,
            sub_action: sub_action,
            indicator_period: indicatorPeriod,
            cross: cross,
            deadline: deadline,
            success: 0,
            created_date: new Date()
        };
        if (indicatorName.substr(1, 2) === "MA") {
            order["MA"] = `${JSON.stringify(value)}`;
        } else {
            order[indicatorName] = value;
        }
        order["indicator"] = indicatorName;
        const queryStr = "INSERT INTO orders SET ?";
        await transaction();
        await query(queryStr, order);
        await commit();
        return {message: "The order placed! You can check the result in History and Orders now."};
    } catch(error) {
        await rollback();
        return {error: "Place order failed"};
    }
};

const matchPriceOrders = async function () {
    try {
        const today = new Date();
        const selectStr = "SELECT * FROM orders WHERE deadline >= ? and success = 0 and price IS NOT NULL";
        const pendingOrders = await query(selectStr, new Date(today.getTime()));
        if (pendingOrders.length === 0) {
            return;
        }
        for (let order of pendingOrders) {
            let successfulOrder;
            const selectOrdersStr = "SELECT * FROM orders WHERE user_id = ? AND symbol = ? AND action = ? AND success = 1";
            const historyOrders = await query(selectOrdersStr, [order.user_id, order.symbol, order.action]);
            switch(order.sub_action){
            case "sell": {
                const buyVolume = historyOrders.filter(i => i.sub_action === "buy").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = historyOrders.filter(i => i.sub_action === "sell").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    successfulOrder = order;
                }
                break;
            }
            case "short cover": {
                const buyVolume = historyOrders.filter(i => i.sub_action === "short").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = historyOrders.filter(i => i.sub_action === "short cover").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    successfulOrder = order;
                }
                break;
            }
            case "buy": {
                successfulOrder = order;
                break;
            }
            case "short": {
                successfulOrder = order;
                break;
            }
            }
            if (successfulOrder) {
                const symbol = successfulOrder.symbol;
                const quote = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
                const currentPrice = quote.data["c"];
                if (successfulOrder.price >= currentPrice) {
                    await transaction();
                    const queryStr = "UPDATE orders SET price = ?, success = 1, success_date = ? WHERE id = ?";
                    await query(queryStr, [currentPrice, today, successfulOrder.id]);
                    await commit();
                }
            }
        }
        return;
    } catch(error) {
        await rollback();
        return {error: "match price orders failed"};
    }
};

const matchIndicatorOrders = async function () {
    try {
        const today = new Date();
        const selectStr = "SELECT * FROM orders WHERE deadline >= ? and success = 0 and price IS NULL";
        const pendingOrders = await query(selectStr, new Date(today.getTime()));
        if (pendingOrders.length === 0) {
            return;
        }
        for (let order of pendingOrders) {
            let successfulOrder;
            const selectOrdersStr = "SELECT * FROM orders WHERE user_id = ? AND symbol = ? AND action = ? AND success = 1";
            const historyOrder = await query(selectOrdersStr, [order.user_id, order.symbol, order.action]);
            switch(order.sub_action){
            case "sell": {
                const buyVolume = historyOrder.filter(i => i.sub_action === "buy").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = historyOrder.filter(i => i.sub_action === "sell").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    successfulOrder = order;
                }
                break;
            }
            case "short cover": {
                const buyVolume = historyOrder.filter(i => i.sub_action === "short").reduce((a, b) => (a+b.volume), 0);
                const sellVolume = historyOrder.filter(i => i.sub_action === "short cover").reduce((a, b) => (a+b.volume), 0);
                if (buyVolume - sellVolume > order.volume) {
                    successfulOrder = order;
                }
                break;
            }
            case "buy": {
                successfulOrder = order;
                break;
            }
            case "short": {
                successfulOrder = order;
                break;
            }
            }
            if (successfulOrder) {
                const symbol = successfulOrder.symbol;
                const indicatorPeriod = successfulOrder.indicatorPeriod;
                const selectStr = "SELECT DISTINCT(time), price FROM stock_price WHERE symbol = ? ORDER BY time DESC LIMIT ?";
                let marketPrices;
                if (successfulOrder.indicator.substr(1, 2) === "MA") {
                    const period = _.max([JSON.parse(successfulOrder.MA)[0]+2, JSON.parse(successfulOrder.MA)[1]+2]);
                    marketPrices = await query(selectStr, [symbol, period]);
                } else {
                    marketPrices = await query(selectStr, [symbol, indicatorPeriod+2]);
                }
                if (marketPrices.length === 0) {
                    return;
                }
                let calculateInput = {
                    values: marketPrices.map(i => i.price),
                    period: indicatorPeriod
                };
                let calculateInputForMA1;
                let calculateInputForMA2;
                let calculateValueForMA1;
                let calculateValueForMA2;
                if (successfulOrder.indicator.substr(1, 2) === "MA") {
                    calculateInputForMA1 = {
                        values: marketPrices.map(i => i.price),
                        period: JSON.parse(successfulOrder.MA)[0]
                    };
                    calculateInputForMA2 = {
                        values: marketPrices.map(i => i.price),
                        period: JSON.parse(successfulOrder.MA)[1]
                    };
                }
                let crossInput;
                switch(successfulOrder.indicator) {
                case "RSI": {
                    const calculateValue = RSI.calculate(calculateInput);
                    crossInput = {
                        lineA: calculateValue,
                        lineB: new Array(calculateValue.length).fill(successfulOrder.RSI)
                    };
                    break;
                }
                case "BB": {
                    calculateInput.stdDev = 2;
                    const calculateValue = BB.calculate(calculateInput).map(i => i[successfulOrder.BBline]);
                    crossInput = {
                        lineA: marketPrices.slice(0-calculateValue.length).map(i => i.price),
                        lineB: calculateValue,
                    };
                    break;
                }
                case "SMA": {
                    calculateValueForMA1 = SMA.calculate(calculateInputForMA1);
                    calculateValueForMA2 = SMA.calculate(calculateInputForMA2);
                    break;
                }
                case "EMA": {
                    calculateValueForMA1 = EMA.calculate(calculateInputForMA1);
                    calculateValueForMA2 = EMA.calculate(calculateInputForMA2);
                    break;
                }
                case "WMA": {
                    calculateValueForMA1 = WMA.calculate(calculateInputForMA1);
                    calculateValueForMA2 = WMA.calculate(calculateInputForMA2);
                    break;
                }
                }
                let arrFilledWithZero;
                if (successfulOrder.indicator.substr(1, 2) === "MA") {
                    arrFilledWithZero = new Array(Math.abs(calculateValueForMA1.length-calculateValueForMA2.length)).fill(0);
                    if (calculateValueForMA1.length > calculateValueForMA2.length) {
                        crossInput = {
                            lineA: calculateValueForMA1,
                            lineB: arrFilledWithZero.concat(calculateValueForMA2)
                        };
                    } else {
                        crossInput = {
                            lineA: calculateValueForMA1,
                            lineB: arrFilledWithZero.concat(calculateValueForMA2)
                        };
                    }
                }
                let crossArr = [];
                switch(successfulOrder.cross) {
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
                    await query(queryStr, [marketPrices[marketPrices.length-1].price, today, successfulOrder.id]);
                    await commit();
                }
            }
        }
        return;
    } catch(error) {
        await rollback();
        return {error: "match indicator orders failed"};
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
        return {error: "delete failed"};
    }
};


module.exports = {
    setOrder,
    matchPriceOrders,
    matchIndicatorOrders,
    deleteOrder
};