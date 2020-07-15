require("dotenv").config();
const _ = require("lodash");
const {RAPID_API_HOST, RAPID_API_KEY} = process.env;
const axios = require("axios");
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");
const {getApiPrices} = require("./stock_model");

const getData = async function (periods, symbols, indicators, indicatorPeriods) {
    try {
        let data = [];
        for (let i of symbols) {
            const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
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
            response.forEach(i => {
                i.indicatorValue = indicatorValue[response.indexOf(i)];
            });
            const singleData = {
                symbol: symbols[index],
                indicator: indicators[index],
                data: response
            };
            data.push(singleData);
        }
        return data;
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving stock price for backtesting";
    }
};


const testWithIndicator = async function (periods, symbols, indicators, indicatorPeriods, actions, actionValues, exitValues, volumes) {
    try {
        let data = [];
        for (let i of symbols) {
            const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
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
                lineB: new Array(indicatorValue.length).fill(Math.abs(parseInt(actionValues[index])))
            };
            const exitInput = {
                lineA: indicatorValue,
                lineB: new Array(indicatorValue.length).fill(Math.abs(parseInt(exitValues[index])))
            };
            let actionCross;
            let exitCross;
            if (parseInt(actionValues[index]) > 0) {
                actionCross = CrossUp.calculate(actionInput);
            } else {
                actionCross = CrossDown.calculate(actionInput);
                console.log("ere");
            }
            if (parseInt(exitValues[index]) > 0) {
                exitCross = CrossUp.calculate(exitInput);
            } else {
                exitCross = CrossDown.calculate(exitInput);
            }
            actionCross.splice(0, 1, false);
            exitCross.splice(0, 1, false);
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
            let revenue;
            let expenses;
            switch(actions[index]) {
            case "long": {
                revenue = newOrderData.filter(i => newOrderData.indexOf(i) % 2 === 1).reduce((a, b) => a + b.price, 0)*volumes[index];
                expenses = newOrderData.filter(i => newOrderData.indexOf(i) % 2 === 0).reduce((a, b) => a + b.price, 0)*volumes[index];
                break;
            }
            case "short": {
                revenue = newOrderData.filter(i => newOrderData.indexOf(i) % 2 === 0).reduce((a, b) => a + b.price, 0)*volumes[index];
                expenses = newOrderData.filter(i => newOrderData.indexOf(i) % 2 === 1).reduce((a, b) => a + b.price, 0)*volumes[index];
            }
            }
            const profit = (revenue - expenses);
            const ROI = (revenue - expenses)/expenses;
            const singleData = {
                symbol: i,
                action: actions[index],
                indicator: indicators[index],
                actionValue: actionValues[index],
                exitValue: exitValues[index],
                volume: volumes[index],
                revenue: revenue,
                expenses: expenses,
                profit: profit,
                ROI: ROI,
                data: newOrderData,
                chart: chartData
            };
            data.push(singleData);
        }
        const totalProfit = _.sumBy(data, "profit");
        const totalROI = _.sumBy(data, "revenue")/_.sumBy(data, "expenses")-1;
        return {
            data: data,
            totalProfit: totalProfit,
            totalROI: totalROI
        };
    } catch(error) {
        console.log(error);
        return "Error when testing with RSI";
    }
};


module.exports = {
    getData,
    testWithIndicator
};