import {getElement, getDataByClass, createInput, createSelect, showLoginBtn, createList, removeChild} from "./utils.js";
const token = window.localStorage.getItem("token");
showLoginBtn(token);

//Search stock button
const searchBtn = getElement("#searchBtn");
searchBtn.addEventListener("click")

//Show graphs of indicators
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
                            showline: false,
                            overlaying: "y",
                        }
                    }
                    
                    const div = document.createElement("div");
                    div.id = id;
                    div.className = "graph";
                    getElement("#graph_container").appendChild(div);
                    if (response.indicator === "BB") {
                        const indicatorTrace1 = {
                            x: response.data.map(i => i.time.substr(0,10)),
                            y: response.data.map(i => i.indicatorValue.lower),
                            type: "scatter",
                            name: "LowerBB",
                            yaxis: "y2",
                            marker: {color: "rgba(0, 86, 98, 0.5)"},
                        };
                        const indicatorTrace2 = {
                            x: response.data.map(i => i.time.substr(0,10)),
                            y: response.data.map(i => i.indicatorValue.middle),
                            type: "scatter",
                            name: "MiddleBB",
                            yaxis: "y2",
                            fill: "tonexty",
                            marker: {color: "rgba(0, 86, 98, 0.5)"},
                            fillcolor: "rgba(153, 183, 187,0.3)",
                            opacity: 0.5
                        };
                        const indicatorTrace3 = {
                            x: response.data.map(i => i.time.substr(0,10)),
                            y: response.data.map(i => i.indicatorValue.upper),
                            type: "scatter",
                            name: "UpperBB",
                            yaxis: "y2",
                            fill: "tonexty",
                            marker: {color: "rgba(0, 86, 98, 0.5)"},
                            fillcolor: "rgba(153, 183, 187,0.3)",
                            opacity: 0.5
                        };
                        const data = [indicatorTrace1, indicatorTrace2, indicatorTrace3, priceTrace];
                        Plotly.newPlot(id, data, layout);
                    } else {
                        const indicatorTrace = {
                            x: response.data.map(i => i.time.substr(0,10)),
                            y: response.data.map(i => i.indicatorValue),
                            type: "scatter",
                            name: response.indicator,
                            yaxis: "y2",
                            marker: {color: "rgba(0, 86, 98, 0.7)"},
                        };
                        const data = [indicatorTrace, priceTrace];
                        Plotly.newPlot(id, data, layout);
                    }
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

//Show backtestResult
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
    let indicatorActionTrace1 = {
        x: response.data.filter(i => i.action === "buy").map(i => i.time.substr(0,10)),
        y: Array(response.data.length).fill(Math.abs(response.actionValue)),
        type: "scatter",
        name: "Action Value",
        yaxis: "y2",
        marker: {color: "#920000"},
    };
    let indicatorActionTrace2 = {
        x: response.data.filter(i => i.action === "sell").map(i => i.time.substr(0,10)),
        y: Array(response.data.length).fill(Math.abs(response.exitValue)),
        type: "scatter",
        name: "Exit Value",
        yaxis: "y2",
        marker: {color: "#046900"},
    };
    const actionValue = Math.abs(response.actionValue);
    const exitValue = Math.abs(response.exitValue);
    let buyArrow = response.data.filter(i => i.action === "buy").map(i => ({
        x: i.time.substr(0,10),
        y: actionValue,
        xref: 'x',
        yref: 'y2',
        text: 'Buy',
        font: {
            color: '#ffffff'
        },
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowwidth: 2,
        arrowcolor: '#636363',
        ax: 0,
        ay: 40,
        bgcolor: "#920000",
        opacity: 0.8
    }))
    let sellArrow = response.data.filter(i => i.action === "sell").map(i => ({
        x: i.time.substr(0,10),
        y: exitValue,
        xref: 'x',
        yref: 'y2',
        text: 'Sell',
        font: {
            color: '#ffffff'
        },
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowwidth: 2,
        arrowcolor: '#636363',
        ax: 0,
        ay: -40,
        bgcolor: '#046900',
        opacity: 0.8
    }))
    if (response.action === "short") {
        indicatorActionTrace1.x = response.data.filter(i => i.action === "sell").map(i => i.time.substr(0,10)),
        indicatorActionTrace2.x = response.data.filter(i => i.action === "buy").map(i => i.time.substr(0,10)),
        indicatorActionTrace1.marker.color = "#046900";
        indicatorActionTrace2.marker.color = "#920000";
        buyArrow.forEach(i => {
            i.y = exitValue;
            i.ay = -40
        });
        sellArrow.forEach(i => {
            i.y = actionValue;
            i.ay = 40
        });
    }
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
        },
        annotations: buyArrow.concat(sellArrow)
    }
    const data = [priceTrace, indicatorTrace, indicatorActionTrace1,indicatorActionTrace2];
    const div = document.createElement("div");
    div.id = div_id;
    div.className = "graph";
    getElement("#result_container").appendChild(div);
    Plotly.newPlot(div_id, data, layout);

    let resultList = response.data.map(i => ({
        time: i.time.substr(0,10),
        price: i.price,
        indicator: i.indicatorValue,
        action: i.action
    }));

    const ul = document.createElement("ul");
    ul.id = ul_id;
    ul.className = "user_ul";
    getElement("#result_container").appendChild(ul);
    createList(`#${ul_id}`, "title_li", ["Time", "Price", response.indicator, "Action"])
    resultList.forEach(i => {
        if (i.action === "buy") {
            createList(`#${ul_id}`, "user_li buy_li", Object.values(i));
        } else {
            createList(`#${ul_id}`, "user_li sell_li", Object.values(i));
        }
        
    })  
}

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
            bbline: getDataByClass("bbline"),
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
    createSelect("indicator",["RSI", "BB", "SMA", "EMA", "WMA"]);
    createInput("indicatorPeriod");
    createInput("volume");
    createInput("actionValue");
    createInput("exitValue");
    createSelect("bbline",["upper", "middle", "lower"]);
});

//Test with my own cide
const codeBtn = getElement("#codeBtn");
codeBtn.addEventListener("click",
    async function() {
        removeChild("result_container");
        removeChild("graph_container");
        removeChild("profit");
        removeChild("ROI");
        const data = {
            code: getElement("#backtest_code").value
        }
        // try {
        const res = await fetch("/api/1.0/backtest/testByUserCode", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resJson = (await res.json()).data;
        console.log(resJson)
        if (resJson.error) {
            alert(resJson.error);
        } else {
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
