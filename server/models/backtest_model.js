require("dotenv").config();
const _ = require("lodash");
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const BB = require("technicalindicators").BollingerBands;
const {query} = require("../../utils/mysqlcon.js");
const {getApiPrices} = require("./stock_model");
const {isMA} = require("../../utils/util.js");

const showIndicatorData = async function (periods, symbol, indicator, indicatorPeriod) {
    const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
    let prices;
    const databasePrices = await query(selectStr, [symbol, periods[0], periods[1]]);
    if (databasePrices.length === 0) {
        const apiPrices = await getApiPrices(symbol);
        prices = apiPrices.map(i => ({
            time: new Date(i.date*1000),
            price: i.close,
            volume: i.volume
        })).filter(i => i.time >= new Date(periods[0]) && i.time <= new Date(periods[1]));
    } else {
        prices = databasePrices;
    }
    let indicatorValue;
    let calculateInput = {
        values: prices.map(i => i.price),
        period: parseInt(indicatorPeriod)
    };
    switch(indicator) {
    case "price": {
        indicatorValue = prices;
        break;
    }
    case "RSI": {
        indicatorValue = RSI.calculate(calculateInput);
        break;
    }
    case "BB": {
        calculateInput.stdDev = 2;
        indicatorValue = BB.calculate(calculateInput);
        break;
    }
    case "SMA": {
        indicatorValue = SMA.calculate(calculateInput);
        break;
    }
    case "EMA": {
        indicatorValue = EMA.calculate(calculateInput);
        break;
    }
    case "WMA": {
        indicatorValue = WMA.calculate(calculateInput);
        break;
    }
    }
    //Fill with zero for first few days
    let arrFilledWithZero = new Array(indicatorPeriod).fill(0);
    const concatValue = arrFilledWithZero.concat(indicatorValue);
    let data = {
        symbol: symbol,
        indicator: indicator,
        indicatorPeriod: indicatorPeriod,
        times: prices.map(i => i.time),
        prices: prices.map(i => i.price),
        values: concatValue,
    };
    if (indicator === "price") {
        delete data.values;
    }
    return data;
};


const testWithIndicator = async function (periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross) {
    const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
    let prices;
    const databasePrices = await query(selectStr, [symbol, periods[0], periods[1]]);
    if (databasePrices.length === 0) {
        const apiPrices = await getApiPrices(symbol);
        prices = apiPrices.map(i => ({
            time: new Date(i.date*1000),
            price: i.close,
            volume: i.volume
        })).filter(i => i.time >= new Date(periods[0]) && i.time <= new Date(periods[1]));
    } else {
        prices = databasePrices;
    }
    let indicatorValue;
    let calculateInput = {
        values: prices.map(i => i.price),
        period: parseInt(indicatorPeriod)
    };
    //MA needs 2 lines
    let calculateInputForMA1;
    let calculateInputForMA2;
    let indicatorValueForMA1;
    let indicatorValueForMA2;
    if (isMA(indicator)) {
        calculateInputForMA1 = {
            values: prices.map(i => i.price),
            period: parseInt(actionValue)
        };
        calculateInputForMA2 = {
            values: prices.map(i => i.price),
            period: parseInt(exitValue)
        };
    }
    switch(indicator) {
    case "price": {
        indicatorValue = prices.map(i => i.price);
        break;
    }
    case "RSI": {
        indicatorValue = RSI.calculate(calculateInput);
        break;
    }
    case "BB": {
        calculateInput.stdDev = 2;
        indicatorValue = BB.calculate(calculateInput).slice(0, -1);
        break;
    }
    case "SMA": {
        indicatorValueForMA1 = SMA.calculate(calculateInputForMA1);
        indicatorValueForMA2 = SMA.calculate(calculateInputForMA2);
        break;
    }
    case "EMA": {
        indicatorValueForMA1 = EMA.calculate(calculateInputForMA1);
        indicatorValueForMA2 = EMA.calculate(calculateInputForMA2);
        break;
    }
    case "WMA": {
        indicatorValueForMA1 = WMA.calculate(calculateInputForMA1);
        indicatorValueForMA2 = WMA.calculate(calculateInputForMA2);
        break;
    }
    }
    let arrFilledWithZero = []; 
    let arrFilledWithZeroForMA1 = [];
    let arrFilledWithZeroForMA2 = [];
    let newIndicatorValue = [];
    //Fill with zero for first few days
    if (!isMA(indicator)) {
        arrFilledWithZero = new Array(prices.length - indicatorValue.length).fill(0);
        newIndicatorValue = arrFilledWithZero.concat(indicatorValue);
    } else {
        arrFilledWithZeroForMA1 = new Array(prices.length - indicatorValueForMA1.length).fill(0);
        indicatorValueForMA1 = arrFilledWithZeroForMA1.concat(indicatorValueForMA1);
        arrFilledWithZeroForMA2 = new Array(prices.length - indicatorValueForMA2.length).fill(0);
        indicatorValueForMA2 = arrFilledWithZeroForMA2.concat(indicatorValueForMA2);
        for (let i =0; i<indicatorValueForMA1.length; i ++) {
            newIndicatorValue.push({actionValue1: indicatorValueForMA1[i], actionValue2: indicatorValueForMA2[i]});
        }
    }
    let actionInput;
    let exitInput;
    if (indicator === "BB") {
        actionInput = {
            lineA: prices.map(i => i.price),
            lineB: arrFilledWithZero.concat(indicatorValue.map(i => i[actionValue]))
        };
        exitInput = {
            lineA: prices.map(i => i.price),
            lineB: arrFilledWithZero.concat(indicatorValue.map(i => i[exitValue]))
        };
    } else if (indicator === "RSI" || indicator === "price") {
        actionInput = {
            lineA: arrFilledWithZero.concat(indicatorValue),
            lineB: new Array(newIndicatorValue.length).fill(actionValue)
        };
        exitInput = {
            lineA: arrFilledWithZero.concat(indicatorValue),
            lineB: new Array(newIndicatorValue.length).fill(exitValue)
        };
    } else {
        actionInput = {
            lineA: indicatorValueForMA1,
            lineB: indicatorValueForMA2
        };
        exitInput = {
            lineA: indicatorValueForMA2,
            lineB: indicatorValueForMA1
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
    if (isMA(indicator)) {
        actionCrossArr = actionCrossArr.fill(false, 0, _.max([arrFilledWithZeroForMA1.length+1, arrFilledWithZeroForMA2.length+1]));
        exitCrossArr = exitCrossArr.fill(false, 0, _.max([arrFilledWithZeroForMA1.length+1, arrFilledWithZeroForMA2.length+1]));
    } else {
        actionCrossArr = actionCrossArr.fill(false, 0, arrFilledWithZero.length+1);
        exitCrossArr = exitCrossArr.fill(false, 0, arrFilledWithZero.length+1);
    }
    //Find buy and sell points
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
        times: prices.map(i => i.time),
        values: newIndicatorValue,
        prices: prices.map(i => i.price),
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
    //Concat buy and sell arrays
    const allArr = _.orderBy(actionArr.concat(exitArr), "index");
    let filterData = [];
    //Filter backtesting results
    switch(action) {
    case "long": {
        filterData = getFilterData(allArr, prices, indicatorResult, "buy", "sell");
        break;
    }
    case "short": {
        filterData = getFilterData(allArr, prices, indicatorResult, "sell", "buy");
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
};


const saveBacktestResult = async function (token, periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross, investmentReturn, ROI) {
    if (indicator === "price") {
        indicatorPeriod = null;
    }
    const today = new Date();
    const selectStr = "SELECT id FROM user WHERE access_token = ?";
    const id = await query(selectStr, token);
    if (id.length === 0) {
        return {error: "Wrong authentication"};
    }
    let data = {
        user_id: id[0].id,
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
    const insertStr = "INSERT INTO backtest_result SET ?";
    await query(insertStr, data);
    data.periods = periods;
    return data;
};

const getSavedResults = async function (token) {
    const selectStr = "SELECT id FROM user WHERE access_token = ?";
    const id = await query(selectStr, token);
    if (id.length === 0) {
        return {error: "Wrong authentication"};
    }
    const selectTestsStr = "SELECT * FROM backtest_result WHERE USER_ID = ? ORDER BY id DESC";
    const savedBackestingResults = await query(selectTestsStr, id[0].id);
    savedBackestingResults.forEach(i => {
        i.periods = JSON.parse(i.periods);
        if (isMA(i.indicator)) {
            i.actionValue = JSON.parse(i.actionValue);
            i.exitValue = JSON.parse(i.exitValue);
        }
    });  
    return savedBackestingResults;
};

//Function for testWithIndicator
const getFilterData = function(arr, prices, indicatorResult, action, exit) {
    let filterData = [];
    let originActionIndex = 0;
    let actionData = {};
    let originExitIndex = 0;
    let exitData = {};
    while (arr.findIndex(i => i.action === action && i.index > originExitIndex) !== -1) {
        const actionIndex = arr.findIndex(i => i.action === action && i.index > originExitIndex);
        if (actionIndex !== -1) {
            originActionIndex = arr[actionIndex]["index"];
            actionData = {
                time: prices[originActionIndex].time,
                price: prices[originActionIndex].price,
                indicatorValue: indicatorResult.values[originActionIndex],
                action: arr[actionIndex]["action"]
            };
            arr.splice(0, actionIndex+1);
        }
        const exitIndex = arr.findIndex(i => i.action === exit && i.index > originActionIndex);
        if (exitIndex !== -1) {
            originExitIndex = arr[exitIndex]["index"];
            exitData = {
                time: prices[originExitIndex].time,
                price: prices[originExitIndex].price,
                indicatorValue: indicatorResult.values[originExitIndex],
                action: arr[exitIndex]["action"]
            };
            arr.splice(0, exitIndex+1);
        }
        if (actionIndex !== -1 && exitIndex !== -1) {
            filterData.push(actionData);
            filterData.push(exitData);
        }
    }
    return filterData;
};


module.exports = {
    showIndicatorData,
    testWithIndicator,
    saveBacktestResult,
    getSavedResults
};