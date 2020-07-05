import {getElement, getDataByClass, createList, createListWithLink, createForm,} from "./utils.js";
//Get Price
const getDataBtn = getElement("#getDataBtn");
getDataBtn.addEventListener("click",
    async function (){
        const data = {
            periods: getDataByClass("period"),
            symbols: getDataByClass("symbol")
        }
        try {
            const res = await fetch("/api/1.0/backtest/getData", {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resJson = (await res.json()).data;
            const chartData = resJson.map(i =>  ({
                x: i.times,
                y: i.prices,
                mode: "lines",
                type: "scatter",
                name: i.symbol,
            }))
            let priceLayout = {
                title: "Stock price",
                xaxis: {
                    title: "Date",
                    type: "date",
                    rangebreaks: [{
                        pattern: "day of week",
                        bounds: [6, 1]
                    }],
                },
                yaxis: {
                    title: "Price",
                    side: "left"
                }
            };
            Plotly.newPlot("priceChart", chartData, priceLayout);
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)

const backtestBtn = getElement("#backtestBtn");
backtestBtn.addEventListener("click",
    async function (){
        const data = {
            periods: getDataByClass("period"),
            symbols: getDataByClass("symbol"),
            actions: getDataByClass("action"),
            prices: getDataByClass("price"),
            exitPrices: getDataByClass("exitPrice"),
            volumes: getDataByClass("volume"),
        }
        try {
            const res = await fetch("/api/1.0/backtest/getResult", {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resJson = (await res.json()).data;
            console.log(resJson);
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)
