import {getElement, getDataByClass, createInput, createSelect, showLoginBtn, createList, removeChild} from "./utils.js";
const token = window.localStorage.getItem("token");
showLoginBtn(token);

const showGraphBtn = getElement("#showGraphBtn");
showGraphBtn.addEventListener("click",
    async function (){
        removeChild("result_container");
        removeChild("profit");
        removeChild("ROI");
        removeChild("graph_container");
        const data = {
            periods: getDataByClass("period"),
            symbols: getDataByClass("symbol"),
            indicators: getDataByClass("indicator"),
            indicatorPeriods: getDataByClass("indicatorPeriod"),
        }
        // try {
            const res = await fetch("/api/1.0/backtest/getData", {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resJson = (await res.json()).data;
            if (resJson.error) {
                alert(resJson.error);
            } else {
                function showGraph(id, response) {
                    const priceTrace = {
                        x: response.data.map(i => i.time.substr(0,10)),
                        y: response.data.map(i => i.price),
                        type: "scatter",
                        name: "Price",
                        yaxis: "y1",
                        marker: {color: "#3fa089"}
                    };
                    const indicatorTrace = {
                        x: response.data.map(i => i.time.substr(0,10)),
                        y: response.data.map(i => i.indicatorValue),
                        type: "scatter",
                        name: response.indicator,
                        yaxis: "y2",
                        marker: {color: "#005662"},
                    };
                    let layout = {
                        title: response.symbol,
                        xaxis: {
                            title: "Date",
                            type: "cateogry",
                        },
                        yaxis1: {
                            title: "Price",
                            side: "left",
                            showline: false,
                            showgrid: false,
                        },
                        yaxis2: {
                            title: "RSI",
                            side: "right",
                            overlaying: "y",
                            showline: false,
                        }
                    }
                    const data = [priceTrace, indicatorTrace];
                    const div = document.createElement("div");
                    div.id = id;
                    div.className = "graph";
                    getElement("#graph_container").appendChild(div);
                    Plotly.newPlot(id, data, layout);
                }
                resJson.forEach(i => {
                    showGraph(`chart${resJson.indexOf(i)}`, i);
                })
            }
        // } catch (err) {
        //     console.log("price fetch failed, err");
        // }
    }
)

const backtestBtn = getElement("#backtestBtn");
backtestBtn.addEventListener("click",
    async function (){
        removeChild("result_container");
        removeChild("graph_container");
        removeChild("profit");
        removeChild("ROI");
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
            if (resJson.error) {
                alert(resJson.error);
            } else {
                function showResult(div_id, ul_id, response) {
                    const priceTrace = {
                        x: response.chart.map(i => i.time.substr(0,10)),
                        y: response.chart.map(i => i.price),
                        type: "scatter",
                        name: "Price",
                        yaxis: "y1",
                        marker: {color: "#3fa089"}
                    };
                    const indicatorTrace = {
                        x: response.chart.map(i => i.time.substr(0,10)),
                        y: response.chart.map(i => i.indicatorValue),
                        type: "scatter",
                        name: response.indicator,
                        yaxis: "y2",
                        marker: {color: "#005662"},
                    };
                    const indicatorActionTrace1 = {
                        x: response.data.filter(i => i.actionCross === true).map(i => i.time.substr(0,10)),
                        y: Array(response.data.length).fill(Math.abs(response.actionValue)),
                        type: "scatter",
                        name: "Action Value",
                        yaxis: "y2",
                        marker: {color: "#920000"},
                    };
                    const indicatorActionTrace2 = {
                        x: response.data.filter(i => i.exitCross === true).map(i => i.time.substr(0,10)),
                        y: Array(response.data.length).fill(Math.abs(response.exitValue)),
                        type: "scatter",
                        name: "Exit Value",
                        yaxis: "y2",
                        marker: {color: "#046900"},
                    };
                    let layout = {
                        title: response.symbol,
                        xaxis: {
                            title: "Date",
                            type: "cateogry",
                        },
                        yaxis1: {
                            title: "Price",
                            side: "left",
                            showline: false,
                            showgrid: false,
                        },
                        yaxis2: {
                            title: response.indicator,
                            side: "right",
                            overlaying: "y",
                            showline: false,
                        }
                    }
                    const data = [priceTrace, indicatorTrace, indicatorActionTrace1,indicatorActionTrace2];
                    const div = document.createElement("div");
                    div.id = div_id;
                    div.className = "graph";
                    getElement("#result_container").appendChild(div);
                    Plotly.newPlot(div_id, data, layout);
                    const resultList = response.data.map(i => ({
                        time: i.time.substr(0,10),
                        price: i.price,
                        indicator: i.indicatorValue
                    }));
                    const ul = document.createElement("ul");
                    ul.id = ul_id;
                    ul.className = "user_ul";
                    getElement("#result_container").appendChild(ul);
                    createList(`#${ul_id}`, "user_li", ["Time", "Price", response.indicator])
                    resultList.map(i => createList(`#${ul_id}`, "user_li", Object.values(i)));
                }
                resJson.data.forEach(i => {
                    showResult(`resultChart${resJson.data.indexOf(i)}`,`result${resJson.data.indexOf(i)}`, i);
                });
                getElement("#profit").innerHTML = `<h2>Total Profit: ${Math.round(resJson.totalProfit)}</h2>`;
                getElement("#ROI").innerHTML = `<h2>Total ROI: ${(resJson.totalROI*100)}%</h2>`;
            }
        // } catch (err) {
        //     console.log("price fetch failed", err);
        // }
    }
)

//Add more stock
const addSymbolBtn = getElement("#addSymbolBtn");
addSymbolBtn.addEventListener("click", function() {
    createInput("symbol");
    createSelect("action",["long", "short"]);
    createSelect("indicator",["RSI", "SMA", "EMA", "WMA"]);
    createInput("indicatorPeriod");
    createInput("volume");
    createInput("actionValue");
    createInput("exitValue");
});