require("dotenv").config();
const _ = require("lodash");
const {RAPID_API_HOST, RAPID_API_KEY} = process.env;
const axios = require("axios");
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const BB = require("technicalindicators").BollingerBands;
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
            case "BB": {
                calculateValue.stdDev = 2;
                indicatorValue = BB.calculate(calculateValue);
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


const testWithIndicator = async function (periods, symbols, indicators, indicatorPeriods, actions, actionValues, exitValues, volumes, bbline) {
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
            case "BB": {
                calculateValue.stdDev = 2;
                indicatorValue = BB.calculate(calculateValue);
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
            
            let arr = new Array(parseInt(indicatorPeriods[index])).fill(indicatorValue[0], 0, parseInt(indicatorPeriods[index]));
            const newIndicatorValue = arr.concat(indicatorValue);
            let actionInput;
            let exitInput;
            if (indicators[index] === "BB") {
                actionInput = {
                    lineA: arr.concat(indicatorValue.map(i => i[bbline[index]])),
                    lineB: new Array(newIndicatorValue.length).fill(Math.abs(parseInt(actionValues[index])))
                };
                exitInput = {
                    lineA: arr.concat(indicatorValue.map(i => i[bbline[index]])),
                    lineB: new Array(newIndicatorValue.length).fill(Math.abs(parseInt(exitValues[index])))
                };
            } else {
                actionInput = {
                    lineA: arr.concat(indicatorValue),
                    lineB: new Array(newIndicatorValue.length).fill(Math.abs(parseInt(actionValues[index])))
                };
                exitInput = {
                    lineA: arr.concat(indicatorValue),
                    lineB: new Array(newIndicatorValue.length).fill(Math.abs(parseInt(exitValues[index])))
                };
            }
            let actionCross;
            let exitCross;
            if (parseInt(actionValues[index]) > 0) {
                actionCross = CrossUp.calculate(actionInput);
            } else {
                actionCross = CrossDown.calculate(actionInput);
            }
            if (parseInt(exitValues[index]) > 0) {
                exitCross = CrossUp.calculate(exitInput);
            } else {
                exitCross = CrossDown.calculate(exitInput);
            }
            actionCross.splice(0, 1, false);
            exitCross.splice(0, 1, false);
            response.forEach(i => {
                if (indicators[index] === "BB") {
                    i.indicatorValue = newIndicatorValue[response.indexOf(i)][bbline[index]];
                } else {
                    i.indicatorValue = newIndicatorValue[response.indexOf(i)];
                }
                i.actionCross = actionCross[response.indexOf(i)];
                i.exitCross = exitCross[response.indexOf(i)];
            });
            const chartData = [...response];
            let newOrderData = [];
            while (response.filter(i => i.exitCross === true).length !== 0 ) {
                const buyIndex = response.findIndex(i => i.actionCross === true);
                let buyData = response[buyIndex];
                response.splice(0, buyIndex+1);
                const sellIndex = response.findIndex(i => i.exitCross === true);
                let sellData = response[sellIndex];
                
                response.splice(0, sellIndex+1);
                if (buyIndex !== -1 && sellIndex !== -1) {
                    newOrderData.push(buyData, sellData);
                    switch(actions[index]) {
                    case "long": {
                        buyData.action = "buy";
                        sellData.action = "sell";
                        break;
                    }
                    case "short": {
                        buyData.action = "sell";
                        sellData.action = "buy";
                        break;
                    }
                    }
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


const testByUserCode = async function (code) {
    console.log(code);
    try {
        const codeNoSpace = code.replace(/ /g, "");
        if (codeNoSpace === "") {
            return {error: "Please enter correct code"};
        }
        let codeStr;
        if (codeNoSpace.substr(codeNoSpace.length -1) === ";") {
            codeStr = codeNoSpace.toLowerCase().substr(0, codeNoSpace.length -1);
        } else {
            codeStr = codeNoSpace;
        }
        const re = /=|;/;
        let codeSpilt = codeStr.split(re);
        const nameSet = ["start", "end", "stock", "value", "condition", "volume", "action"];
        let codeArr = [];
        codeSpilt.forEach(i => {
            if (nameSet.includes(i)) {
                const a = `"${i}":`;
                codeArr.push(a);
            } else if (nameSet.includes(i.substr(0, 5))) {
                const b = `"${i}":`;
                codeArr.push(b);
            }  else if (nameSet.includes(i.substr(0, 9))) {
                const c = `"${i}":`;
                codeArr.push(c);
            } else {
                const d = `"${i}",`;
                codeArr.push(d);
            }
        });
        const codeJoin = codeArr.join(" ");
        const codeSubstr = codeJoin.substr(0, codeJoin.length-1);
        let codeParse = JSON.parse(`{${codeSubstr}}`);
        console.log(codeParse);
        codeParse.indicator = codeParse.value.split("(")[0].toUpperCase();
        codeParse.indicatorPeriod = parseInt(codeParse.value.substring(codeParse.value.indexOf("(")+1, codeParse.value.indexOf(")")));
        codeParse.condition1 = codeParse.condition1.substring(codeParse.condition1.indexOf("(")+1, codeParse.condition1.indexOf(")")).split(",");
        codeParse.condition2 = codeParse.condition2.substring(codeParse.condition2.indexOf("(")+1, codeParse.condition2.indexOf(")")).split(",");
        delete codeParse.value;
        if (codeParse.condition1[0] === "crossdown") {
            codeParse.condition1[1] = -codeParse.condition1[1];
        } else {
            codeParse.condition1[1] = parseInt(codeParse.condition1[1]);
        }
        if (codeParse.condition2[0] === "crossdown") {
            codeParse.condition2[1] = -codeParse.condition2[1];
        } else {
            codeParse.condition2[1] = parseInt(codeParse.condition2[1]);
        }
        codeParse.stock = codeParse.stock.toUpperCase();
        codeParse.volume = parseInt(codeParse.volume);
        
        
        if ((codeParse.action === "long" && codeParse.condition1[2] === "buy" && codeParse.condition2[2] === "sell") || (codeParse.action === "short" && codeParse.condition1[2] === "sell" && codeParse.condition2[2] === "buy")) {
            codeParse.actionValue = codeParse.condition1[1];
            codeParse.exitValue = codeParse.condition2[1];
        } else if ((codeParse.action === "long" && codeParse.condition2[2] === "buy" && codeParse.condition1[2] === "sell") || (codeParse.action === "short" && codeParse.condition2[2] === "sell" && codeParse.condition1[2] === "buy")) {
            codeParse.exitValue = codeParse.condition1[1];
            codeParse.actionValue = codeParse.condition2[1];
        } else {
            return {error: "Please have 1 condition for buy and 1 condition for sell"};
        }
        
        
        if (Date.parse(codeParse.start)<0 || Date.parse(codeParse.end)<0) {
            return {error: "Please enter correct data type"};
        }
        delete codeParse.condition1;
        delete codeParse.condition2;
        const keys = ["start", "end", "stock", "action", "volume", "indicator", "indicatorPeriod", "actionValue", "exitValue"];
        if (keys.filter(i => !Object.keys(codeParse).includes(i)).length !== 0) {
            return {error: "Please make sure to assign start, end, stock, value, conditions, action, volume"};
        }
        return testWithIndicator([codeParse.start, codeParse.end], [codeParse.stock], [codeParse.indicator], [codeParse.indicatorPeriod], [codeParse.action], [codeParse.actionValue], [codeParse.exitValue], [codeParse.volume]);
    } catch(error) {
        console.log(error);
        return {error: "Please make sure you entered the right codes"};
    }
    
};


module.exports = {
    getData,
    testWithIndicator,
    testByUserCode
};