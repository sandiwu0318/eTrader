import {getElement, getDataByClass, createInput, createSelect, showLoginBtn, createList, removeChild} from "./utils.js";
const token = window.localStorage.getItem("token");
showLoginBtn(token);

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
            symbol: getDataByClass("symbol")[0],
            indicator: getElement(".indicator").value,
            indicatorPeriod: parseInt(getDataByClass("indicatorPeriod")[1]),
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
                    let plotData = [];
                    const priceTrace = {
                        x: response.times.map(i => i.substr(0,10)),
                        y: response.prices,
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
                        }
                    }
                    plotData.push(priceTrace);
                    if (response.indicator === "BB") {
                        const indicatorTrace1 = {
                            x: response.times.map(i => i.substr(0,10)),
                            y: response.values.map(i => i.lower),
                            type: "scatter",
                            name: "LowerBB",
                            yaxis: "y1",
                            marker: {color: "rgba(0, 86, 98, 0.5)"},
                        };
                        const indicatorTrace2 = {
                            x: response.times.map(i => i.substr(0,10)),
                            y: response.values.map(i => i.middle),
                            type: "scatter",
                            name: "MiddleBB",
                            yaxis: "y1",
                            fill: "tonexty",
                            marker: {color: "rgba(0, 86, 98, 0.5)"},
                            fillcolor: "rgba(153, 183, 187,0.3)",
                            opacity: 0.5
                        };
                        const indicatorTrace3 = {
                            x: response.times.map(i => i.substr(0,10)),
                            y: response.values.map(i => i.upper),
                            type: "scatter",
                            name: "UpperBB",
                            yaxis: "y1",
                            fill: "tonexty",
                            marker: {color: "rgba(0, 86, 98, 0.5)"},
                            fillcolor: "rgba(153, 183, 187,0.3)",
                            opacity: 0.5
                        };
                        plotData.push(indicatorTrace1, indicatorTrace2, indicatorTrace3);
                    } else {
                        let indicatorTrace = {
                            x: response.times.map(i => i.substr(0,10)),
                            y: response.values,
                            type: "scatter",
                            name: response.indicator,
                            yaxis: "y1",
                        };
                        console.log(indicatorTrace)
                        switch (response.indicator) {
                            case "RSI": {
                                layout.yaxis2 = {
                                    title: response.indicator,
                                    side: "right",
                                    showline: false,
                                    overlaying: "y",
                                }
                                indicatorTrace.yaxis = "y2";
                                indicatorTrace.marker = {color: "rgba(0, 86, 98, 0.7)"};
                                break;
                            }
                            case "SMA": {
                                indicatorTrace.marker = {color: "rgba(0, 98, 0, 0.7)"};
                                break;
                            }
                            case "EMA": {
                                indicatorTrace.marker = {color: "rgba(71, 146, 71, 0.7)"};
                                break;
                            }
                            case "WMA": {
                                indicatorTrace.marker = {color: "rgba(15, 68, 15, 0.7)"};
                                break;
                            }
                        }
                        plotData.push(indicatorTrace);
                    }
                    const div = document.createElement("div");
                    div.id = id;
                    div.className = "graph";
                    getElement("#graph_container").appendChild(div);
                    Plotly.newPlot(id, plotData, layout);
                }
                showGraph("chart", resJson);
            }
        // } catch (err) {
        //     console.log("price fetch failed, err");
        // }
    }
)

//Show backtestResult
function showResult(div_id, ul_id, response) {
    let plotData = [];
    const priceTrace = {
        x: response.chart[0].times.map(i => i.substr(0,10)),
        y: response.chart[0].prices,
        type: "scatter",
        name: "Price",
        yaxis: "y1",
        marker: {color: "#3fa089"}
    };
    plotData.push(priceTrace);
    if (response.indicator === "BB") {
        const indicatorTrace1 = {
            x: response.chart[0].times.slice(response.indicatorPeriod-1).map(i => i.substr(0,10)),
            y: response.chart[0].values.slice(response.indicatorPeriod-1).map(i => i[response.actionValue]),
            type: "scatter",
            name: response.actionValue,
            yaxis: "y1",
            marker: {color: "#920000"},
        };
        const indicatorTrace2 = {
            x: response.chart[0].times.slice(response.indicatorPeriod-1).map(i => i.substr(0,10)),
            y: response.chart[0].values.slice(response.indicatorPeriod-1).map(i => i[response.exitValue]),
            type: "scatter",
            name: response.exitValue,
            yaxis: "y1",
            marker: {color: "#046900"},
        };
        plotData.push(indicatorTrace1, indicatorTrace2);
    } else {
        const indicatorTrace = {
            x: response.chart[0].times.map(i => i.substr(0,10)),
            y: response.chart[0].values,
            type: "scatter",
            name: response.indicator,
            yaxis: "y2",
            marker: {color: "#005662"},
        };
        plotData.push(indicatorTrace);
    }
    let indicatorActionTrace1 = {
        x: response.data.filter(i => i.action === "buy").map(i => i.time.substr(0,10)),
        y: Array(response.data.length).fill(response.actionValue),
        type: "scatter",
        name: "Action Timing",
        yaxis: "y2",
        marker: {color: "#920000"},
    };
    let indicatorActionTrace2 = {
        x: response.data.filter(i => i.action === "sell").map(i => i.time.substr(0,10)),
        y: Array(response.data.length).fill(response.exitValue),
        type: "scatter",
        name: "Exit Timing",
        yaxis: "y2",
        marker: {color: "#046900"},
    };  
    const actionValue = response.actionValue;
    const exitValue = response.exitValue;
    const buyFilter = response.data.filter(i => i.action === "buy");
    const sellFilter = response.data.filter(i => i.action === "sell");
    let buyArrow = buyFilter.map(i => ({
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
    let sellArrow = sellFilter.map(i => ({
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
        indicatorActionTrace1.x = sellFilter.map(i => i.time.substr(0,10)),
        indicatorActionTrace2.x = buyFilter.map(i => i.time.substr(0,10)),
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
    if (response.indicator == "BB") {
        switch(response.action) {
        case "long": {
            buyArrow.forEach(i => {
                i.y = buyFilter[buyArrow.indexOf(i)].indicatorValue[response.actionValue];
                i.yref = 'y1';
            })
            sellArrow.forEach(i => {
                i.y = sellFilter[sellArrow.indexOf(i)].indicatorValue[response.exitValue];
                i.yref = 'y1';
            })
            break;
        }
        case "short": {
            sellArrow.forEach(i => {
                i.y = sellFilter[sellArrow.indexOf(i)].indicatorValue[response.actionValue];
                i.yref = 'y1';
            })
            buyArrow.forEach(i => {
                i.y = buyFilter[buyArrow.indexOf(i)].indicatorValue[response.exitValue];
                i.yref = 'y1';
            })
            break;
        }
        }
    }
    console.log("-------buyArrow--------")
    console.log(buyArrow)
    console.log("-------sellArrow--------")
    console.log(sellArrow)
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
    console.log(indicatorActionTrace1)
    console.log(indicatorActionTrace2)
    if (response.indicator !== "BB") {
        plotData.push(indicatorActionTrace1, indicatorActionTrace2);
    }
    const div = document.createElement("div");
    div.id = div_id;
    div.className = "graph";
    getElement("#result_container").appendChild(div);
    Plotly.newPlot(div_id, plotData, layout);

    let resultList = response.data.map(i => ({
        time: i.time.substr(0,10),
        price: i.price,
        indicator: i.indicatorValue,
        action: i.action
    }));
    if (response.indicator === "BB") {
        resultList.forEach(i => {
            console.log(Object.values(response.data[resultList.indexOf(i)].indicatorValue))
            i.indicator = Object.values(response.data[resultList.indexOf(i)].indicatorValue).map(i => Math.floor(i))
            i.indicator = i.indicator.slice(0, -1)
        })
    }
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
        const indicator = getElement(".indicator").value;
        let indicator_test;
        let data = {
            periods: getDataByClass("period"),
            symbol: getDataByClass("symbol")[0],
            action: getElement(".action").value,
            volume: parseInt(getElement(".volume").value),
            indicator: indicator,
            indicatorPeriod: parseInt(document.getElementsByClassName("indicatorPeriod")[1].value),
        };
        if (indicator.substr(1 ,2) === "MA") {
            indicator_test = "MA_test";
            const values = getDataByClass(indicator_test).slice(1);
            data.actionValue = [parseInt(values[0]), parseInt(values[2])],
            data.actionCross = values[1],
            data.exitValue = [parseInt(values[3]), parseInt(values[5])],
            data.exitCross = values[4]
        } else if (indicator === "BB") {
            indicator_test = "BB_test";
            const values = getDataByClass(indicator_test).slice(1);
            data.actionValue = values[1],
            data.actionCross = values[0],
            data.exitValue = values[3],
            data.exitCross = values[2]
        } else {
            indicator_test = `${indicator}_test`;
            const values = getDataByClass(indicator_test).slice(1);
            data.actionValue = parseInt(values[1]),
            data.actionCross = values[0],
            data.exitValue = parseInt(values[3]),
            data.exitCross = values[2]
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
            console.log(resJson)
            if (resJson.error) {
                alert(resJson.error);
            } else {
                showResult("result_graph","result_ul", resJson);
                getElement("#profit").innerHTML = `<h2>Investment Return: ${Math.round(resJson.investmentReturn)}</h2>`;
                getElement("#ROI").innerHTML = `<h2>ROI: ${(resJson.ROI*100)}%</h2>`;
            }
        // } catch (err) {
        //     console.log("price fetch failed", err);
        // }
    }
)

// //Test with my own cide
// const codeBtn = getElement("#codeBtn");
// codeBtn.addEventListener("click",
//     async function() {
//         removeChild("result_container");
//         removeChild("graph_container");
//         removeChild("profit");
//         removeChild("ROI");
//         const data = {
//             code: getElement("#backtest_code").value
//         }
//         // try {
//         const res = await fetch("/api/1.0/backtest/testByUserCode", {
//             method: "POST",
//             body: JSON.stringify(data),
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });
//         const resJson = (await res.json()).data;
//         console.log(resJson)
//         if (resJson.error) {
//             alert(resJson.error);
//         } else {
//             resJson.data.forEach(i => {
//                 showResult(`resultChart${resJson.data.indexOf(i)}`,`result${resJson.data.indexOf(i)}`, i);
//             });
//             getElement("#profit").innerHTML = `<h2>Total Profit: ${Math.round(resJson.totalProfit)}</h2>`;
//             getElement("#ROI").innerHTML = `<h2>Total ROI: ${(resJson.totalROI*100)}%</h2>`;
//         }
//         // } catch (err) {
//         //     console.log("price fetch failed", err);
//         // }
//     }
// )

const indicator = getElement(".indicator");
indicator.addEventListener("change", () => {    
    let selectClass;
    if (indicator.value.substr(1,2) === "MA") {
        selectClass = ".MA_test";
    } else {
        selectClass = `.${indicator.value}_test`;
    }
    getElement(".show").classList.add("hide");
    getElement(".show").classList.remove("show");
    getElement(selectClass).classList.add("show");
    getElement(selectClass).classList.remove("hide");
})