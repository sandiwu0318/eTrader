require("dotenv").config();
const {FINNHUB_API_KEY} = process.env;
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const BB = require("technicalindicators").BollingerBands;
const axios = require("axios");
const _ = require("lodash");
const {query} = require("../../utils/mysqlcon.js");
const {getApiPrices} = require("./stock_model");
const {isMA} = require("../../utils/util.js");

const setOrder = async function (token, symbol, indicator, value, indicatorPeriod, cross, volume, action, sub_action, period) {
    if (indicator === "price" || isMA(indicator)) {
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
    if (isMA(indicatorName)) {
        order["MA"] = `${JSON.stringify(value)}`;
    } else {
        order[indicatorName] = value;
    }
    order["indicator"] = indicatorName;
    const queryStr = "INSERT INTO orders SET ?";
    await query(queryStr, order);
    return {message: "The order placed! You can check the result in History and Orders now."};
};

const matchPriceOrders = async function () {
    const today = new Date();
    const selectStr = "SELECT * FROM orders WHERE deadline >= ? and success = 0 and price IS NOT NULL";
    const pendingOrders = await query(selectStr, new Date(today.getTime()));
    if (pendingOrders.length === 0) {
        return;
    }
    const validOrders = checkValidOrder(pendingOrders);
    validOrders.forEach(i => {
        i.index = validOrders.indexOf(i);
    });
    const uniqueSymbols = _.uniq(validOrders.map(i => i.symbol));
    for (let symbol of uniqueSymbols) {
        const quote = (await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`));
        const currentPrice = quote.data["c"];
        let copiedOrders = [...validOrders];
        while (copiedOrders.findIndex(j => j.symbol === symbol) !== -1) {
            const indexOfSymbol = copiedOrders.findIndex(j => j.symbol === symbol);
            const index = copiedOrders[indexOfSymbol].index;
            const indexOfValue = validOrders[index];
            const updateStr = "UPDATE orders SET price = ?, success = 1, success_date = ? WHERE id = ?";
            if (indexOfValue.sub_action === "buy" || indexOfValue.sub_action === "short cover") {
                if (indexOfValue.price >= currentPrice) {
                    await query(updateStr, [currentPrice, today, indexOfValue.id]);
                }
            } else {
                if (indexOfValue.price <= currentPrice) {
                    await query(updateStr, [currentPrice, today, indexOfValue.id]);
                }
            }
            copiedOrders.splice(0, indexOfSymbol+1);
        }
    }
    return;
};

const matchIndicatorOrders = async function () {
    const today = new Date();
    const selectStr = "SELECT * FROM orders WHERE deadline >= ? and success = 0 and price IS NULL";
    const pendingOrders = await query(selectStr, new Date(today.getTime()));
    if (pendingOrders.length === 0) {
        return;
    }
    const validOrders = checkValidOrder(pendingOrders);
    for (let order of validOrders) {
        if (order) {
            const symbol = order.symbol;
            const indicatorPeriod = order.indicatorPeriod;
            const selectStr = "SELECT DISTINCT(time), price FROM stock_price WHERE symbol = ? ORDER BY time DESC LIMIT ?";
            let marketPrices;
            let period;
            if (isMA(order.indicator)) {
                period = _.max([JSON.parse(order.MA)[0]+2, JSON.parse(order.MA)[1]+2]);
            } else {
                period = indicatorPeriod+2;
            }
            const databasePrices = await query(selectStr, [symbol, period]);
            if (databasePrices.length === 0) {
                const apiPriceData = (await getApiPrices(symbol)).slice(-period);
                marketPrices = apiPriceData.map(i => i.close);
            } else {
                marketPrices = databasePrices.map(i => i.price);
            }
            let calculateInput = {
                values: marketPrices,
                period: indicatorPeriod
            };
            let calculateInputForMA1;
            let calculateInputForMA2;
            let calculateValueForMA1;
            let calculateValueForMA2;
            if (isMA(order.indicator)) {
                calculateInputForMA1 = {
                    values: marketPrices.map(i => i.price),
                    period: JSON.parse(order.MA)[0]
                };
                calculateInputForMA2 = {
                    values: marketPrices.map(i => i.price),
                    period: JSON.parse(order.MA)[1]
                };
            }
            let crossInput;
            switch(order.indicator) {
            case "RSI": {
                const calculateValue = RSI.calculate(calculateInput);
                crossInput = {
                    lineA: calculateValue,
                    lineB: new Array(calculateValue.length).fill(order.RSI)
                };
                break;
            }
            case "BB": {
                calculateInput.stdDev = 2;
                const calculateValue = BB.calculate(calculateInput).map(i => i[order.BBline]);
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
            if (isMA(order.indicator)) {
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
            switch(order.cross) {
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
                const queryStr = "UPDATE orders SET price = ?, success = 1, success_date = ? WHERE id = ?";
                await query(queryStr, [marketPrices[marketPrices.length-1].price, today, validOrder.id]);
            }
        }
    }
    return;
};

const deleteOrder = async function (id) {
    const deleteStr = "DELETE FROM orders WHERE id = ?";
    await query(deleteStr, id);
    return {message: "success"};
};

const checkValidOrder = async function(orders) {
    let validOrders = [];
    for (let order of orders) {
        const selectOrdersStr = "SELECT * FROM orders WHERE user_id = ? AND symbol = ? AND action = ? AND success = 1";
        const historyOrders = await query(selectOrdersStr, [order.user_id, order.symbol, order.action]);
        switch(order.sub_action){
        case "sell": {
            const buyVolume = historyOrders.filter(i => i.sub_action === "buy").reduce((a, b) => (a+b.volume), 0);
            const sellVolume = historyOrders.filter(i => i.sub_action === "sell").reduce((a, b) => (a+b.volume), 0);
            if (buyVolume - sellVolume > order.volume) {
                validOrders.push(order);
            }
            break;
        }
        case "short cover": {
            const buyVolume = historyOrders.filter(i => i.sub_action === "short").reduce((a, b) => (a+b.volume), 0);
            const sellVolume = historyOrders.filter(i => i.sub_action === "short cover").reduce((a, b) => (a+b.volume), 0);
            if (buyVolume - sellVolume > order.volume) {
                validOrders.push(order);
            }
            break;
        }
        case "buy": {
            validOrders.push(order);
            break;
        }
        case "short": {
            validOrders.push(order);
            break;
        }
        }
    }
    return validOrders;
};


module.exports = {
    setOrder,
    matchPriceOrders,
    matchIndicatorOrders,
    deleteOrder
};