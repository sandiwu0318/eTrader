require("dotenv").config();
const _ = require("lodash");
const {RSI, SMA, EMA, WMA, CrossUp, CrossDown} = require("technicalindicators");
const BB = require("technicalindicators").BollingerBands;
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const getData = async function (periods, symbol, indicator, indicatorPeriod) {
    try {
        const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
        await transaction();
        const response = await query(selectStr, [symbol, periods[0], periods[1]]);
        await commit();
        let indicatorValues = [];
        let indicatorValue;
        let calculateValue = {
            values: response.map(i => i.price),
            period: parseInt(indicatorPeriod)
        };
        switch(indicator) {
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
        const data = {
            symbol: symbol,
            indicator: indicator,
            indicatorPeriod: indicatorPeriod,
            times: response.map(i => i.time),
            prices: response.map(i => i.price),
            values: indicatorValue,
        };
        return data;
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving stock price for backtesting";
    }
};


const testWithIndicator = async function (periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross) {
    try {
        const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? AND time <= ? ORDER BY time";
        await transaction();
        const response = await query(selectStr, [symbol, periods[0], periods[1]]);
        await commit();
        let indicatorValues = [];
        let indicatorValue;
        let calculateValue = {
            values: response.map(i => i.price),
            period: parseInt(indicatorPeriod)
        };
        switch(indicator) {
        case "RSI": {
            indicatorValue = RSI.calculate(calculateValue);
            break;
        }
        case "BB": {
            calculateValue.stdDev = 2;
            indicatorValue = BB.calculate(calculateValue).slice(0, -1);
            console.log("------indicatorValue------");
            console.log(indicatorValue);
            console.log(indicatorValue.length);
            console.log(response.length);
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
        // console.log("-------response-------");
        // console.log(response);
        let arr = new Array(response.length - indicatorValue.length).fill(0);
        const newIndicatorValue = arr.concat(indicatorValue);
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
        } else {
            actionInput = {
                lineA: arr.concat(indicatorValue),
                lineB: new Array(newIndicatorValue.length).fill(actionValue)
            };
            exitInput = {
                lineA: arr.concat(indicatorValue),
                lineB: new Array(newIndicatorValue.length).fill(exitValue)
            };
            console.log(123);
        }
        console.log("-----actionInput------");
        console.log(actionInput);
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
        
        actionCrossArr = actionCrossArr.fill(false, 0, arr.length+1);
        exitCrossArr = exitCrossArr.fill(false, 0, arr.length+1);
        console.log("-------actionCrossArr------");
        console.log(actionCrossArr);
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
        indicatorValues.push(indicatorResult);
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
            while (allArr.findIndex(i => i.action === "buy") !== -1) {
                const buyIndex = allArr.findIndex(i => i.action === "buy");
                let originBuyIndex = 0;
                let buyData = {};
                if (buyIndex !== -1) {
                    originBuyIndex = allArr[buyIndex]["index"];
                    buyData = {
                        time: response[originBuyIndex].time,
                        price: response[originBuyIndex].price,
                        indicatorValue: indicatorValues.filter(i => i.indicator !== "price")[0].values[originBuyIndex],
                        action: allArr[buyIndex]["action"]
                    };
                    allArr.splice(0, buyIndex+1);
                }
                const sellIndex = allArr.findIndex(i => i.action === "sell");
                let originSellIndex = 0;
                let sellData = {};
                if (sellIndex !== -1) {
                    originSellIndex = allArr[sellIndex]["index"];
                    sellData = {
                        time: response[originSellIndex].time,
                        price: response[originSellIndex].price,
                        indicatorValue: indicatorValues.filter(i => i.indicator !== "price")[0].values[originSellIndex],
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
            while (allArr.findIndex(i => i.action === "sell") !== -1) {
                const sellIndex = allArr.findIndex(i => i.action === "sell");
                let originSellIndex = 0;
                let sellData = {};
                if (sellIndex !== -1) {
                    originSellIndex = allArr[sellIndex]["index"];
                    sellData = {
                        time: response[originSellIndex].time,
                        price: response[originSellIndex].price,
                        indicatorValue: indicatorValues.filter(i => i.indicator !== "price")[0].values[originSellIndex],
                        action: allArr[sellIndex]["action"]
                    };
                    allArr.splice(0, sellIndex+1);
                }
                const buyIndex = allArr.findIndex(i => i.action === "buy");
                let originBuyIndex = 0;
                    
                let buyData = {};
                if (buyIndex !== -1) {
                    originBuyIndex = allArr[buyIndex]["index"];
                    buyData = {
                        time: response[originBuyIndex].time,
                        price: response[originBuyIndex].price,
                        indicatorValue: indicatorValues.filter(i => i.indicator !== "price")[0].values[originBuyIndex],
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
            chart: indicatorValues
        };
        return singleData;
    } catch(error) {
        console.log(error);
        return "Error when testing with indicators";
    }
};


// const testByUserCode = async function (code) {
//     try {
//         const codeNoSpace = code.replace(/ /g, "");
//         if (codeNoSpace === "") {
//             return {error: "Please enter correct code"};
//         }
//         let codeStr;
//         if (codeNoSpace.substr(codeNoSpace.length -1) === ";") {
//             codeStr = codeNoSpace.toLowerCase().substr(0, codeNoSpace.length -1);
//         } else {
//             codeStr = codeNoSpace;
//         }
//         const re = /=|;/;
//         let codeSpilt = codeStr.split(re);
//         const nameSet = ["start", "end", "stock", "value", "condition", "volume", "action"];
//         console.log(codeSpilt);
//         let codeArr = [];
//         codeSpilt.forEach(i => {
//             if (nameSet.includes(i)) {
//                 const a = `"${i}":`;
//                 codeArr.push(a);
//             } else if (nameSet.includes(i.substr(0, 5))) {
//                 const b = `"${i}":`;
//                 codeArr.push(b);
//             }  else if (nameSet.includes(i.substr(0, 9))) {
//                 const c = `"${i}":`;
//                 codeArr.push(c);
//             } else {
//                 const d = `"${i}",`;
//                 codeArr.push(d);
//             }
//         });
//         const codeJoin = codeArr.join(" ");
//         const codeSubstr = codeJoin.substr(0, codeJoin.length-1);
//         let codeParse = JSON.parse(`{${codeSubstr}}`);
//         console.log(codeParse);
//         codeParse.indicator = codeParse.value.split("(")[0].toUpperCase();
//         codeParse.indicatorPeriod = parseInt(codeParse.value.substring(codeParse.value.indexOf("(")+1, codeParse.value.indexOf(")")));
//         codeParse.condition1 = codeParse.condition1.substring(codeParse.condition1.indexOf("(")+1, codeParse.condition1.indexOf(")")).split(",");
//         codeParse.condition2 = codeParse.condition2.substring(codeParse.condition2.indexOf("(")+1, codeParse.condition2.indexOf(")")).split(",");
//         delete codeParse.value;
//         if (codeParse.condition1[0] === "crossdown") {
//             codeParse.condition1[1] = -codeParse.condition1[1];
//         } else {
//             codeParse.condition1[1] = parseInt(codeParse.condition1[1]);
//         }
//         if (codeParse.condition2[0] === "crossdown") {
//             codeParse.condition2[1] = -codeParse.condition2[1];
//         } else {
//             codeParse.condition2[1] = parseInt(codeParse.condition2[1]);
//         }
//         codeParse.stock = codeParse.stock.toUpperCase();
//         codeParse.volume = parseInt(codeParse.volume);
        
        
//         if ((codeParse.action === "long" && codeParse.condition1[2] === "buy" && codeParse.condition2[2] === "sell") || (codeParse.action === "short" && codeParse.condition1[2] === "sell" && codeParse.condition2[2] === "buy")) {
//             codeParse.actionValue = codeParse.condition1[1];
//             codeParse.exitValue = codeParse.condition2[1];
//         } else if ((codeParse.action === "long" && codeParse.condition2[2] === "buy" && codeParse.condition1[2] === "sell") || (codeParse.action === "short" && codeParse.condition2[2] === "sell" && codeParse.condition1[2] === "buy")) {
//             codeParse.exitValue = codeParse.condition1[1];
//             codeParse.actionValue = codeParse.condition2[1];
//         } else {
//             return {error: "Please have 1 condition for buy and 1 condition for sell"};
//         }
        
        
//         if (Date.parse(codeParse.start)<0 || Date.parse(codeParse.end)<0) {
//             return {error: "Please enter correct data type"};
//         }
//         delete codeParse.condition1;
//         delete codeParse.condition2;
//         const keys = ["start", "end", "stock", "action", "volume", "indicator", "indicatorPeriod", "actionValue", "exitValue"];
//         if (keys.filter(i => !Object.keys(codeParse).includes(i)).length !== 0) {
//             return {error: "Please make sure to assign start, end, stock, value, conditions, action, volume"};
//         }
//         return testWithIndicator([codeParse.start, codeParse.end], [codeParse.stock], [codeParse.indicator], [codeParse.indicatorPeriod], [codeParse.action], [codeParse.actionValue], [codeParse.exitValue], [codeParse.volume]);
//     } catch(error) {
//         console.log(error);
//         return {error: "Please make sure you entered the right codes"};
//     }
// };


module.exports = {
    getData,
    testWithIndicator,
    // testByUserCode
};