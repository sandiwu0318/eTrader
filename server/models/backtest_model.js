require("dotenv").config();
const _ = require("lodash");
const {RAPID_API_HOST, RAPID_API_KEY} = process.env;
const axios = require("axios");

const getData = async function (periods, symbols) {
    try {
        let dataSet = [];
        for (let i of symbols) {
            const config = {
                "headers":{
                    "x-rapidapi-host":RAPID_API_HOST,
                    "x-rapidapi-key":RAPID_API_KEY,
                    "useQueryString":true
                }, "params":{
                    "frequency":"1d",
                    "filter":"history",
                    "period1":new Date(periods[0]).getTime()/1000,
                    "period2":new Date(periods[1]).getTime()/1000,
                    "symbol":i
                }
            };
            const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-historical-data", config);
            const data = {
                symbol: i,
                times: response.data.prices.map(i => new Date(i.date*1000)),
                prices: response.data.prices.map(i => i.close),
            };
            dataSet.push(data);
        }
        return dataSet;
    } catch(error) {
        console.log(error);
        return "Error when retrieving stock price";
    }
};

const getResult = async function (periods, symbols, actions, prices, exitPrices, volumes) {
    try {
        let data = [];
        for (let i of symbols) {
            const config = {
                "headers":{
                    "x-rapidapi-host":RAPID_API_HOST,
                    "x-rapidapi-key":RAPID_API_KEY,
                    "useQueryString":true
                }, "params":{
                    "frequency":"1d",
                    "filter":"history",
                    "period1":new Date(periods[0]).getTime()/1000,
                    "period2":new Date(periods[1]).getTime()/1000,
                    "symbol":i
                }
            };
            const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-historical-data", config);
            let action;
            let exitAction;
            let filters;
            let exitFilters;
            let index = symbols.indexOf(i);
            switch (actions[index]) {
            case "buy": {
                action = "buy";
                exitAction = "sell";
                filters = response.data.prices.filter(i => i.volume >= volumes[index]).filter(a => a.close <= prices[index]);
                exitFilters = response.data.prices.filter(i => i.volume >= volumes[index]).filter(a => a.close >= exitPrices[index]);
                break;
            }
            case "sell": {
                action = "sell";
                exitAction = "buy";
                filters = response.data.prices.filter(i => i.volume >= volumes[index]).filter(a => a.close >= prices[index]);
                exitFilters = response.data.prices.filter(i => i.volume >= volumes[index]).filter(a => a.close <= exitPrices[index]);
                break;
            }
            }
            let filterData = [];
            for (let i of filters) {
                const filter = {
                    action: action,
                    time: new Date(i.date*1000),
                    price: i.close,
                    volume: i.volume
                };
                filterData.push(filter);
            }
            for (let i of exitFilters) {
                const exitFilter = {
                    action: exitAction,
                    time: new Date(i.date*1000),
                    price: i.close,
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
        return "Error when retrieving stock price";
    }
};


module.exports = {
    getData,
    getResult
};