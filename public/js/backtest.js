import {getElement, getDataByClass, createInput, createSelect, showLoginBtn, createList} from "./utils.js";
const id = window.localStorage.getItem("id");
showLoginBtn(id);

const backtestBtn = getElement("#backtestBtn");
backtestBtn.addEventListener("click",
    async function (){
        const data = {
            periods: getDataByClass("period"),
            symbols: getDataByClass("symbol"),
            indicators: getDataByClass("indicator"),
            indicatorPeriods: getDataByClass("indicatorPeriod"),
            actions: getDataByClass("action"),
            volumes: getDataByClass("volume"),
            actionValues: getDataByClass("actionValue"),
            exitValues: getDataByClass("exitValue"),
        }
        // try {
            const res = await fetch("/api/1.0/backtest/testWithIndicator", {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resJson = (await res.json()).data;
            console.log(resJson);
            if (resJson.error) {
                alert(resJson.error);
            } else {
                const priceTrace = {
                    x: resJson.data[0].chart.map(i => i.time),
                    y: resJson.data[0].chart.map(i => i.price),
                    type: "scatter",
                    name: "Price",
                    yaxis: "y1",
                    marker: {color: "#3fa089"}
                };
                const indicatorTrace = {
                    x: resJson.data[0].chart.map(i => i.time),
                    y: resJson.data[0].chart.map(i => i.indicatorValue),
                    type: "scatter",
                    name: "RSI",
                    yaxis: "y2",
                    marker: {color: "#005662"},
                };
                const indicatorActionTrace1 = {
                    x: resJson.data[0].data.filter(i => i.actionCross === true).map(i => i.time),
                    y: Array(resJson.data[0].data.length).fill(resJson.data[0].actionValue),
                    type: "scatter",
                    name: "Action Value",
                    yaxis: "y2",
                    marker: {color: "#920000"},
                };
                const indicatorActionTrace2 = {
                    x: resJson.data[0].data.filter(i => i.exitCross === true).map(i => i.time),
                    y: Array(resJson.data[0].data.length).fill(resJson.data[0].exitValue),
                    type: "scatter",
                    name: "Exit Value",
                    yaxis: "y2",
                    marker: {color: "#046900"},
                };
                let layout = {
                    title: "Backtesting Result",
                    xaxis: {
                        title: "Date",
                        type: "cateogry",
                    },
                    yaxis1: {
                        title: "Price",
                        side: "left",
                        showline: false,
                    },
                    yaxis2: {
                        title: "RSI",
                        side: "right",
                        overlaying: "y",
                        showline: false,
                        showgrid: false,
                    }
                }
                const data = [priceTrace, indicatorTrace, indicatorActionTrace1,indicatorActionTrace2];
                Plotly.newPlot(priceChart, data, layout);
                const resultList = resJson.data[0].data.map(i => ({
                    time: i.time.substr(0,10),
                    price: i.price,
                    indicator: i.indicatorValue
                }));
                createList("#result_ul", "user_li", ["Time", "Price", "Indicator"])
                resultList.map(i => createList("#result_ul", "user_li", Object.values(i)));
            }
        // } catch (err) {
        //     console.log("price fetch failed, err");
        // }
    }
)

//Add more stock
const addSymbolBtn = getElement("#addSymbolBtn");
addSymbolBtn.addEventListener("click", function() {
    createInput("symbol");
    createInput("action");
    createSelect("indicator",["RSI", "SMA", "EMA", "WMA"]);
    createInput("indicatorPeriod");
    createInput("volume");
    createInput("actionValue");
    createInput("exitValue");
});