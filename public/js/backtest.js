import {getElement, createList, createListWithLink, createForm,} from "./utils.js";
//Get Price
const btn = getElement("#btn");
btn.addEventListener("click",
    async function (){
        const periodElement = document.getElementsByClassName("period")
        let periods = [];
        for (let i of periodElement) {
            let period = i.value;
            periods.push(period);
        }
        const symbolsElement = document.getElementsByClassName("symbol")
        let symbols = [];
        for (let i of symbolsElement) {
            let symbol = i.value;
            symbols.push(symbol);
        }
        const data = {
            periods: periods,
            symbols: symbols
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

