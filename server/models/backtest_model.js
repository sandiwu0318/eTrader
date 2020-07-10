require("dotenv").config();
const _ = require("lodash");
const {RAPID_API_HOST, RAPID_API_KEY} = process.env;
const axios = require("axios");
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");
const {getApiPrices} = require("./stock_model");

const getData = async function (periods, symbols) {
    try {
        let dataSet = [];
        for (let i of symbols) {
            const selectStr = "SELECT time, price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ?";
            await transaction();
            let result = await query(selectStr, [i, periods[0], periods[1]]);
            await commit();
            let data;
            if (result.length === 0) {
                result = (await getApiPrices(i, 0));
                const filterRes = result.filter(i => (i.date >= new Date(periods[0]).getTime()/1000) && (i.date <= new Date(periods[1]).getTime()/1000));
                data = {
                    symbol: i,
                    times: filterRes.map(i => new Date(i.date*1000)),
                    prices: filterRes.map(i => i.close),
                };
            } else {
                data = {
                    symbol: i,
                    times: result.map(i => i.time),
                    prices: result.map(i => i.price)
                };
            }
            let RSIcal = RSI.calculate({
                values: result.map(i => i.price),
                period: 14
            });
            let arr = new Array(14).fill(0, 0, 14);
            RSIcal = arr.concat(RSIcal);
            data.RSI = RSIcal;
            dataSet.push(data);
        }
        return dataSet;
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving stock price for backtesting";
    }
};



const testWithPrices = async function (periods, symbols, actions, prices, exitPrices, volumes) {
    try {
        let data = [];
        for (let i of symbols) {
            const selectStr = "SELECT time, price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ?";
            await transaction();
            const response = await query(selectStr, [i, periods[0], periods[1]]);
            await commit();
            let action;
            let exitAction;
            let filters;
            let exitFilters;
            let index = symbols.indexOf(i);
            switch (actions[index]) {
            case "buy": {
                action = "buy";
                exitAction = "sell";
                filters = response.filter(i => i.volume >= parseInt(volumes[index])).filter(a => a.price <= prices[index]);
                exitFilters = response.filter(i => i.volume >= parseInt(volumes[index])).filter(a => a.price >= exitPrices[index]);
                break;
            }
            case "sell": {
                action = "sell";
                exitAction = "buy";
                filters = response.filter(i => i.volume >= parseInt(volumes[index])).filter(a => a.price >= prices[index]);
                exitFilters = response.filter(i => i.volume >= parseInt(volumes[index])).filter(a => a.price <= exitPrices[index]);
                break;
            }
            }
            let filterData = [];
            for (let i of filters) {
                const filter = {
                    action: action,
                    time: new Date(i.date*1000),
                    price: i.price,
                    volume: i.volume
                };
                filterData.push(filter);
            }
            for (let i of exitFilters) {
                const exitFilter = {
                    action: exitAction,
                    time: new Date(i.date*1000),
                    price: i.price,
                    volume: i.volume
                };
                filterData.push(exitFilter);
            }
            const orderData = _.orderBy(filterData, "time");
            let newOrderData = [];
            switch (actions[symbols.indexOf(i)]) {
            case "buy": {
                while (orderData.length > 0 ) {
                    const buyIndex = orderData.findIndex(i => i.action === "buy");
                    const buyData = orderData[buyIndex];
                    orderData.splice(0, buyIndex+1);
                    const sellIndex = orderData.findIndex(i => i.action === "sell");
                    const sellData = orderData[sellIndex];
                    orderData.splice(0, sellIndex+1);
                    if (buyIndex !== -1 && sellIndex !== -1) {
                        newOrderData.push(buyData, sellData);
                    }
                }
                break;
            }
            case "sell": {
                while (orderData.length > 0 ) {
                    const buyIndex = orderData.findIndex(i => i.action === "sell");
                    const buyData = orderData[buyIndex];
                    orderData.splice(0, buyIndex+1);
                    const sellIndex = orderData.findIndex(i => i.action === "buy");
                    const sellData = orderData[sellIndex];
                    orderData.splice(0, sellIndex+1);
                    if (buyIndex !== -1 && sellIndex !== -1) {
                        newOrderData.push(buyData, sellData);
                    }
                }
                break;
            }
            }
            const earnings = newOrderData.filter(i => i.action === "sell").reduce((a, b) => a + b.price, 0);
            const expenses = newOrderData.filter(i => i.action === "buy").reduce((a, b) => a + b.price, 0);
            const profit = (earnings - expenses) * volumes[index];
            const singleData = {
                symbol: i,
                action: actions[index],
                volume: volumes[index],
                profit: profit,
                data: newOrderData
            };
            data.push(singleData);
        }
        const totalProfit = data.reduce((a, b) => a + b.profit, 0);
        return {
            data: data,
            totalProfit: totalProfit
        };
    } catch(error) {
        console.log(error);
        return "Error when testing with prices";
    }
};

const testWithIndicator = async function (periods, symbols, indicators, indicatorPeriods, actions, actionValues, exitValues, volumes) {
    try {
        let data = [];
        for (let i of symbols) {
            const selectStr = "SELECT time, price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
            await transaction();
            const response = await query(selectStr, [i, periods[0], periods[1]]);
            await commit();
            let index = symbols.indexOf(i);
            let indicatorValue;
            let calculateValue = {
                values: response.map(i => i.price),
                period: parseInt(indicatorPeriods[index])
            };
            switch(indicators[index]) {
            case "RSI": {
                indicatorValue = RSI.calculate(calculateValue);
                break;
            }
            case "SMA": {
                indicatorValue = SMA.calculate(calculateValue);
                break;
            }
            case "EMA": {
                indicatorValue = EMA.calculate(calculateValue);
                break;
            }
            case "WMA": {
                indicatorValue = WMA.calculate(calculateValue);
                break;
            }
            }
            let arr = new Array(parseInt(indicatorPeriods[index])).fill(0, 0, parseInt(indicatorPeriods[index]));
            indicatorValue = arr.concat(indicatorValue);
            const actionInput = {
                lineA: indicatorValue,
                lineB: new Array(indicatorValue.length).fill(parseInt(actionValues[index]))
            };
            const exitInput = {
                lineA: indicatorValue,
                lineB: new Array(indicatorValue.length).fill(parseInt(exitValues[index]))
            };
            let actionCross;
            let exitCross;
            if (parseInt(actionValues[index]) > 0) {
                actionCross = CrossUp.calculate(actionInput);
            } else {
                actionCross = CrossDown.calculate(actionInput);
            }
            if (parseInt(actionValues[index]) > 0) {
                exitCross = CrossUp.calculate(exitInput);
            } else {
                exitCross = CrossDown.calculate(exitInput);
            }
            response.forEach(i => {
                i.indicatorValue = indicatorValue[response.indexOf(i)];
                i.actionCross = actionCross[response.indexOf(i)];
                i.exitCross = exitCross[response.indexOf(i)];
            });
            const chartData = [...response];
            let newOrderData = [];
            while (response.filter(i => i.exitCross === true).length !== 0 ) {
                const buyIndex = response.findIndex(i => i.actionCross === true);
                const buyData = response[buyIndex];
                response.splice(0, buyIndex+1);
                const sellIndex = response.findIndex(i => i.exitCross === true);
                const sellData = response[sellIndex];
                response.splice(0, sellIndex+1);
                if (buyIndex !== -1 && sellIndex !== -1) {
                    newOrderData.push(buyData, sellData);
                }
            }
            const earnings = newOrderData.filter(i => i.exitCross === true).reduce((a, b) => a + b.price, 0);
            const expenses = newOrderData.filter(i => i.actionCross === true).reduce((a, b) => a + b.price, 0);
            const profit = (earnings - expenses) * volumes[index];
            const singleData = {
                symbol: i,
                indicator: indicators[index],
                actionValue: parseInt(actionValues[index]),
                exitValue: parseInt(exitValues[index]),
                action: actions[index],
                volume: parseInt(volumes[index]),
                profit: profit,
                data: newOrderData,
                chart: chartData
            };
            data.push(singleData);
        }
        const totalProfit = data.reduce((a, b) => a + b.profit, 0);
        return {
            data: data,
            totalProfit: totalProfit,
        };
    } catch(error) {
        console.log(error);
        return "Error when testing with RSI";
    }
};


module.exports = {
    getData,
    testWithPrices,
    testWithIndicator
};