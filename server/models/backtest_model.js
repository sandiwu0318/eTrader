require("dotenv").config();
const _ = require("lodash");
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const BB = require("technicalindicators").BollingerBands;
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");
const {getApiPrices} = require("./stock_model");

const getData = async function (periods, symbol, indicator, indicatorPeriod) {
    try {
        const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
        let response = await query(selectStr, [symbol, periods[0], periods[1]]);
        if (response.length === 0) {
            const result = await getApiPrices(symbol);
            response = result.map(i => ({
                time: new Date(i.date*1000),
                price: i.close,
                volume: i.volume
            })).filter(i => i.time >= new Date(periods[0]) && i.time <= new Date(periods[1]));
        }
        let indicatorValue;
        let calculateValue = {
            values: response.map(i => i.price),
            period: parseInt(indicatorPeriod)
        };
        switch(indicator) {
        case "price": {
            indicatorValue = response;
            break;
        }
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
        let arr = new Array(indicatorPeriod).fill(0);
        indicatorValue = arr.concat(indicatorValue);
        let data = {
            symbol: symbol,
            indicator: indicator,
            indicatorPeriod: indicatorPeriod,
            times: response.map(i => i.time),
            prices: response.map(i => i.price),
            values: indicatorValue,
        };
        if (indicator === "price") {
            delete data.values;
        }
        return data;
    } catch(error) {
        console.log(error);
        return {error};
    }
};


const testWithIndicator = async function (periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross) {
    try {
        const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
        let response = await query(selectStr, [symbol, periods[0], periods[1]]);
        if (response.length === 0) {
            const result = await getApiPrices(symbol);
            response = result.map(i => ({
                time: new Date(i.date*1000),
                price: i.close,
                volume: i.volume
            })).filter(i => i.time >= new Date(periods[0]) && i.time <= new Date(periods[1]));
        }
        let indicatorValue;
        let calculateValue = {
            values: response.map(i => i.price),
            period: parseInt(indicatorPeriod)
        };
        let calculateValue1;
        let calculateValue2;
        let indicatorValue1;
        let indicatorValue2;
        if (indicator.substr(1, 2) === "MA") {
            calculateValue1 = {
                values: response.map(i => i.price),
                period: parseInt(actionValue)
            };
            calculateValue2 = {
                values: response.map(i => i.price),
                period: parseInt(exitValue)
            };
        }
        switch(indicator) {
        case "price": {
            indicatorValue = response.map(i => i.price);
            break;
        }
        case "RSI": {
            indicatorValue = RSI.calculate(calculateValue);
            break;
        }
        case "BB": {
            calculateValue.stdDev = 2;
            indicatorValue = BB.calculate(calculateValue).slice(0, -1);
            break;
        }
        case "SMA": {
            indicatorValue1 = SMA.calculate(calculateValue1);
            indicatorValue2 = SMA.calculate(calculateValue2);
            break;
        }
        case "EMA": {
            indicatorValue1 = EMA.calculate(calculateValue1);
            indicatorValue2 = EMA.calculate(calculateValue2);
            break;
        }
        case "WMA": {
            indicatorValue1 = WMA.calculate(calculateValue1);
            indicatorValue2 = WMA.calculate(calculateValue2);
            break;
        }
        }
        let arr = []; 
        let arr1 = [];
        let arr2 = [];
        let newIndicatorValue = [];
        if (indicator.substr(1, 2) !== "MA") {
            arr = new Array(response.length - indicatorValue.length).fill(0);
            newIndicatorValue = arr.concat(indicatorValue);
        } else {
            arr1 = new Array(response.length - indicatorValue1.length).fill(0);
            indicatorValue1 = arr1.concat(indicatorValue1);
            arr2 = new Array(response.length - indicatorValue2.length).fill(0);
            indicatorValue2 = arr2.concat(indicatorValue2);
            for (let i =0; i<indicatorValue1.length; i ++) {
                newIndicatorValue.push({actionValue1: indicatorValue1[i], actionValue2: indicatorValue2[i]});
            }
        }
        let actionInput;
        let exitInput;
        if (indicator === "BB") {
            actionInput = {
                lineA: response.map(i => i.price),
                lineB: arr.concat(indicatorValue.map(i => i[actionValue]))
            };
            exitInput = {
                lineA: response.map(i => i.price),
                lineB: arr.concat(indicatorValue.map(i => i[exitValue]))
            };
        } else if (indicator === "RSI" || indicator === "price") {
            actionInput = {
                lineA: arr.concat(indicatorValue),
                lineB: new Array(newIndicatorValue.length).fill(actionValue)
            };
            exitInput = {
                lineA: arr.concat(indicatorValue),
                lineB: new Array(newIndicatorValue.length).fill(exitValue)
            };
        } else {
            actionInput = {
                lineA: indicatorValue1,
                lineB: indicatorValue2
            };
            exitInput = {
                lineA: indicatorValue2,
                lineB: indicatorValue1
            };
        }
        
        let actionCrossArr = [];
        let exitCrossArr = [];
        switch(actionCross) {
        case "crossup": {
            actionCrossArr = CrossUp.calculate(actionInput);
            break;
        }
        case "crossdown": {
            actionCrossArr = CrossDown.calculate(actionInput);
            break;
        }
        }
        switch(exitCross) {
        case "crossup": {
            exitCrossArr = CrossUp.calculate(exitInput);
            break;
        }
        case "crossdown": {
            exitCrossArr = CrossDown.calculate(exitInput);
            break;
        }
        }
        if (indicator.substr(1, 2) === "MA") {
            actionCrossArr = actionCrossArr.fill(false, 0, _.max([arr1.length+1, arr2.length+1]));
            exitCrossArr = exitCrossArr.fill(false, 0, _.max([arr1.length+1, arr2.length+1]));
        } else {
            actionCrossArr = actionCrossArr.fill(false, 0, arr.length+1);
            exitCrossArr = exitCrossArr.fill(false, 0, arr.length+1);
        }
        let actionCrossIndex = [];
        let actionFirstIndex = 0;
        while(actionCrossArr.findIndex(i => i === true) !== -1) {
            let index = actionCrossArr.findIndex(i => i === true);
            actionCrossIndex.push(index+actionFirstIndex);
            actionFirstIndex += (index+1);
            actionCrossArr.splice(0, index+1);
        }
        let exitCrossIndex = [];
        let exitFirstIndex = 0;
        while(exitCrossArr.findIndex(i => i === true) !== -1) {
            let index = exitCrossArr.findIndex(i => i === true);
            exitCrossIndex.push(index+exitFirstIndex);
            exitFirstIndex += (index+1);
            exitCrossArr.splice(0, index+1);
        }
        const indicatorResult = {
            indicator: indicator,
            times: response.map(i => i.time),
            values: newIndicatorValue,
            prices: response.map(i => i.price),
            actionCrossIndex: actionCrossIndex,
            exitCrossIndex: exitCrossIndex
        };
        let actionArr = [];
        let exitArr = [];
        switch(action) {
        case "long": {
            actionArr = actionCrossIndex.map(i => ({
                index: i,
                action: "buy"
            }));
            exitArr = exitCrossIndex.map(i => ({
                index: i,
                action: "sell"
            }));
            break;
        }
        case "short": {
            actionArr = actionCrossIndex.map(i => ({
                index: i,
                action: "sell"
            }));
            exitArr = exitCrossIndex.map(i => ({
                index: i,
                action: "buy"
            }));
            break;
        }
        }
        const allArr = _.orderBy(actionArr.concat(exitArr), "index");
        let filterData = [];
        switch(action) {
        case "long": {
            let originBuyIndex = 0;
            let buyData = {};
            let originSellIndex = 0;
            let sellData = {};
            while (allArr.findIndex(i => i.action === "buy" && i.index > originSellIndex) !== -1) {
                const buyIndex = allArr.findIndex(i => i.action === "buy" && i.index > originSellIndex);
                if (buyIndex !== -1) {
                    originBuyIndex = allArr[buyIndex]["index"];
                    buyData = {
                        time: response[originBuyIndex].time,
                        price: response[originBuyIndex].price,
                        indicatorValue: indicatorResult.values[originBuyIndex],
                        action: allArr[buyIndex]["action"]
                    };
                    allArr.splice(0, buyIndex+1);
                }
                const sellIndex = allArr.findIndex(i => i.action === "sell" && i.index > originBuyIndex);
                if (sellIndex !== -1) {
                    originSellIndex = allArr[sellIndex]["index"];
                    sellData = {
                        time: response[originSellIndex].time,
                        price: response[originSellIndex].price,
                        indicatorValue: indicatorResult.values[originSellIndex],
                        action: allArr[sellIndex]["action"]
                    };
                    allArr.splice(0, sellIndex+1);
                }
                if (buyIndex !== -1 && sellIndex !== -1) {
                    filterData.push(buyData);
                    filterData.push(sellData);
                }
            }
            break;
        }
        case "short": {
            let originSellIndex = 0;
            let sellData = {};
            let originBuyIndex = 0;
            let buyData = {};
            while (allArr.findIndex(i => i.action === "sell" && i.index > originBuyIndex) !== -1) {
                const sellIndex = allArr.findIndex(i => i.action === "sell" && i.index > originBuyIndex);
                if (sellIndex !== -1) {
                    originSellIndex = allArr[sellIndex]["index"];
                    sellData = {
                        time: response[originSellIndex].time,
                        price: response[originSellIndex].price,
                        indicatorValue: indicatorResult.values[originSellIndex],
                        action: allArr[sellIndex]["action"]
                    };
                    allArr.splice(0, sellIndex+1);
                }
                const buyIndex = allArr.findIndex(i => i.action === "buy" && i.index > originSellIndex);
                if (buyIndex !== -1) {
                    originBuyIndex = allArr[buyIndex]["index"];
                    buyData = {
                        time: response[originBuyIndex].time,
                        price: response[originBuyIndex].price,
                        indicatorValue: indicatorResult.values[originBuyIndex],
                        action: allArr[buyIndex]["action"]
                    };
                    allArr.splice(0, buyIndex+1);
                }
                if (sellIndex !== -1 && buyIndex !== -1) {
                    filterData.push(sellData);
                    filterData.push(buyData);
                }
            }
            break;
        }
        }
        const revenue = filterData.filter(i => i.action === "sell").reduce((a, b) => a+b.price, 0);
        const cost = filterData.filter(i => i.action === "buy").reduce((a, b) => a+b.price, 0);
        const investmentReturn = (revenue - cost);
        const ROI = investmentReturn/cost;
        const singleData = {
            symbol: symbol,
            action: action,
            indicator: indicator,
            actionValue: actionValue,
            exitValue: exitValue,
            volume: volume,
            revenue: revenue,
            cost: cost,
            investmentReturn: investmentReturn,
            ROI: ROI,
            data: filterData,
            chart: indicatorResult
        };
        return singleData;
    } catch(error) {
        console.log(error);
        return {error};
    }
};


const saveBacktestResult = async function (token, periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross, investmentReturn, ROI) {
    try {
        if (indicator === "price") {
            indicatorPeriod = null;
        }
        const today = new Date();
        const selectStr = "SELECT id FROM user WHERE access_token = ?";
        const result = await query(selectStr, token);
        let data = {
            user_id: result[0].id,
            periods: JSON.stringify(periods),
            symbol: symbol,
            action: action,
            volume: volume,
            indicator: indicator,
            indicatorPeriod: indicatorPeriod,
            actionValue: actionValue,
            actionCross: actionCross,
            exitValue: exitValue,
            exitCross: exitCross,
            investmentReturn: investmentReturn,
            ROI: ROI,
            created_date: today
        };
        if(indicator.substr(1, 2) === "MA") {
            data.actionValue = JSON.stringify(actionValue);
            data.exitValue = JSON.stringify(exitValue);
        }
        const insertStr = "INSERT INTO backtest_result SET ?";
        await transaction();
        await query(insertStr, data);
        await commit();
        data.periods = periods;
        data.actionValue = actionValue;
        data.exitValue = exitValue;
        return data;
    } catch(error) {
        console.log(error);
        await rollback();
        return {error};
    }
};

const getSavedResults = async function (token) {
    try {
        const selectStr = "SELECT id FROM user WHERE access_token = ?";
        const result = await query(selectStr, token);
        const selectTestsStr = "SELECT * FROM backtest_result WHERE USER_ID = ? ORDER BY id DESC";
        const results = await query(selectTestsStr, result[0].id);
        results.forEach(i => {
            i.periods = JSON.parse(i.periods);
            if (i.indicator.substr(1, 2) === "MA") {
                i.actionValue = JSON.parse(i.actionValue);
                i.exitValue = JSON.parse(i.exitValue);
            }
        });  
        return results;
    } catch(error) {
        console.log(error);
        return {error};
    }
};


module.exports = {
    getData,
    testWithIndicator,
    saveBacktestResult,
    getSavedResults
};