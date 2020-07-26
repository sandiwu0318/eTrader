import {getElement, getDataByClass, showLoginBtn, createList, removeChild, createButton, checkLogin, removeItem, getSymbols, getInputSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
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
        if (getElement("#setOrderBtn")) {
            removeItem("setOrderBtn");
        }
        if (getElement("#saveBtn")) {
            removeItem("saveBtn");
        }
        const data = {
            periods: getDataByClass("period"),
            symbol: getDataByClass("symbol")[0],
            indicator: getElement(".indicator").value,
            indicatorPeriod: parseInt(getDataByClass("indicatorPeriod")[1]),
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
            if (resJson.error) {
                Swal.fire({
                    title: "Error!",
                    text: resJson.error,
                    icon: "error",
                    confirmButtonText: "Ok"
                });
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
                    } else if (response.indicator !== "price") {
                        let indicatorTrace = {
                            x: response.times.map(i => i.substr(0,10)),
                            y: response.values,
                            type: "scatter",
                            name: response.indicator,
                            yaxis: "y1",
                        };
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
                scrollTo(0, 500);
            }
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)

//Show backtestResult
function showResult(div_id, ul_id, response) {
    let plotData = [];
    const priceTrace = {
        x: response.chart.times.map(i => i.substr(0,10)),
        y: response.chart.prices,
        type: "scatter",
        name: "Price",
        yaxis: "y1",
        marker: {color: "#3fa089"}
    };
    plotData.push(priceTrace);
    let indicatorTrace;
    let indicatorActionTrace1;
    let indicatorActionTrace2;
    if (response.indicator === "BB") {
        const indicatorTrace1 = {
            x: response.chart.times.slice(response.indicatorPeriod-1).map(i => i.substr(0,10)),
            y: response.chart.values.slice(response.indicatorPeriod-1).map(i => i[response.actionValue]),
            type: "scatter",
            name: response.actionValue,
            yaxis: "y1",
            marker: {color: "#920000"},
        };
        const indicatorTrace2 = {
            x: response.chart.times.slice(response.indicatorPeriod-1).map(i => i.substr(0,10)),
            y: response.chart.values.slice(response.indicatorPeriod-1).map(i => i[response.exitValue]),
            type: "scatter",
            name: response.exitValue,
            yaxis: "y1",
            marker: {color: "#046900"},
        };
        plotData.push(indicatorTrace1, indicatorTrace2);
    } else if (response.indicator === "RSI" || response.indicator === "price"){
        indicatorTrace = {
            x: response.chart.times.map(i => i.substr(0,10)),
            y: response.chart.values,
            type: "scatter",
            name: response.indicator,
            yaxis: "y2",
            marker: {color: "#005662"},
        };
        indicatorActionTrace1 = {
            x: response.data.filter(i => i.action === "buy").map(i => i.time.substr(0,10)),
            y: Array(response.data.length).fill(response.actionValue),
            type: "scatter",
            name: "Action Timing",
            yaxis: "y2",
            marker: {color: "#920000"},
        };
        indicatorActionTrace2 = {
            x: response.data.filter(i => i.action === "sell").map(i => i.time.substr(0,10)),
            y: Array(response.data.length).fill(response.exitValue),
            type: "scatter",
            name: "Exit Timing",
            yaxis: "y2",
            marker: {color: "#046900"},
        };
        if (response.action === "short") {
            indicatorActionTrace1.marker.color = "#046900";
            indicatorActionTrace2.marker.color = "#920000";
        }
        if (response.indicator === "price") {
            indicatorActionTrace1.yaxis = "y1";
            indicatorActionTrace2.yaxis = "y1";
        }
    } else {
        const indicatorTrace1 = {
            x: response.chart.times.map(i => i.substr(0,10)),
            y: response.chart.values.map(i => i.actionValue1),
            type: "scatter",
            name: `${response.indicator}${response.actionValue}`,
            yaxis: "y1",
            marker: {color: "#920000"},
        };
        const indicatorTrace2 = {
            x: response.chart.times.map(i => i.substr(0,10)),
            y: response.chart.values.map(i => i.actionValue2),
            type: "scatter",
            name: `${response.indicator}${response.exitValue}`,
            yaxis: "y1",
            marker: {color: "#046900"},
        };
        plotData.push(indicatorTrace1, indicatorTrace2);
    }
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
    if (response.indicator === "RSI" || response.indicator === "price") {
        if (response.action === "short") {
            indicatorActionTrace1.x = sellFilter.map(i => i.time.substr(0,10));
            indicatorActionTrace2.x = buyFilter.map(i => i.time.substr(0,10));
        }
        plotData.push(indicatorTrace,indicatorActionTrace1,indicatorActionTrace2);
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
    if (response.indicator.substr(1, 2) === "MA") {
        switch(response.action) {
            case "long": {
                buyArrow.forEach(i => {
                    i.y = buyFilter[buyArrow.indexOf(i)].indicatorValue["actionValue1"];
                    i.yref = 'y1';
                })
                sellArrow.forEach(i => {
                    i.y = sellFilter[sellArrow.indexOf(i)].indicatorValue["actionValue1"];
                    i.yref = 'y1';
                })
                break;
            }
            case "short": {
                sellArrow.forEach(i => {
                    i.y = sellFilter[sellArrow.indexOf(i)].indicatorValue["actionValue2"];
                    i.yref = 'y1';
                })
                buyArrow.forEach(i => {
                    i.y = buyFilter[buyArrow.indexOf(i)].indicatorValue["actionValue1"];
                    i.yref = 'y1';
                })
                break;
            }
            }
    }
    if (response.indicator === "price") {
        buyArrow.forEach(i => {
            i.yref = 'y1';
        })
        sellArrow.forEach(i => {
            i.yref = 'y1';
        })
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
            i.indicator = Object.values(response.data[resultList.indexOf(i)].indicatorValue).map(i => Math.floor(i))
            i.indicator = i.indicator.slice(0, -1)
        })
    } else if (response.indicator.substr(1, 2) === "MA") {
        resultList.forEach(i => {
            i.indicator = Object.values(response.data[resultList.indexOf(i)].indicatorValue).map(i => Math.floor(i))
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
        if (getElement("#setOrderBtn")) {
            removeItem("setOrderBtn");
        }
        if (getElement("#saveBtn")) {
            removeItem("saveBtn");
        }
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
        try {
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
                Swal.fire({
                    title: "Error!",
                    text: resJson.error,
                    icon: "error",
                    confirmButtonText: "Ok"
                });
            } else {
                createButton("btn", "saveBtn", "test_form", "Save")
                createButton("btn", "setOrderBtn", "test_form", "Set order with this strategy")
                showResult("result_graph","result_ul", resJson);
                getElement("#profit").innerHTML = `<h2>Investment Return: ${Math.round(resJson.investmentReturn)}</h2>`;
                getElement("#ROI").innerHTML = `<h2>ROI: ${(Math.floor(resJson.ROI*10000)/100)}%</h2>`;
                if (data.indicator.substr(1 ,2) === "MA") {
                    data.actionValue = data.actionValue[0];
                    data.exitValue = data.exitValue[0];
                }
                setOrder(data);
                scrollTo(0, 800);
                const saveBtn = getElement("#saveBtn");
                saveBtn.addEventListener("click", async function (e) {
                    e.preventDefault();
                    checkLogin(token);
                    window.scrollTo(0, 0);
                    let data3 = Object.assign({}, data);
                    data3.token = token;
                    data3.investmentReturn = resJson.investmentReturn;
                    data3.ROI = resJson.ROI;
                    console.log(data3)
                    const res3 = await fetch("/api/1.0/backtest/saveBacktestResult", {
                        method: "POST",
                        body: JSON.stringify(data3),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const resJson3 = (await res3.json()).data;
                    console.log(resJson3)
                    if (!getElement("#saved_ul")) {
                        const ul = document.createElement("ul");
                        ul.id = "saved_ul";
                        ul.className = "user_ul";
                        getElement("#saved_results").appendChild(ul);
                        createList(`#saved_ul`, "title_li titles", ["Created","Start", "End", "Symbol", "Indicator", "Action", "ROI"])
                    }
                    createList(`#saved_ul`, "user_li saved_li", [resJson3.created_date.substr(0, 10), resJson3.periods[0],resJson3.periods[1], resJson3.symbol, resJson3.indicator, resJson3.action, `${Math.floor(resJson3.ROI*10000)/100}%`]);
                    const saved_lis = document.getElementsByClassName("saved_li");
                    saved_lis[saved_lis.length-1].addEventListener("click", async function() {
                        removeChild("profit");
                        removeChild("ROI");
                        removeChild("result_container");
                        if (getElement("#setOrderBtn")) {
                            removeItem("setOrderBtn");
                        }
                        const newData = Object.assign({}, resJson3);
                        delete newData.id;
                        delete newData.user_id;
                        delete newData.investmentReturn;
                        delete newData.ROI;
                        const res1 = await fetch("/api/1.0/backtest/testWithIndicator", {
                            method: "POST",
                            body: JSON.stringify(newData),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        const resJson1 = (await res1.json()).data;
                        console.log(resJson1)
                        createButton("btn", "setOrderBtn", "test_form", "Set order with this strategy")
                        showResult("result_graph","result_ul", resJson1);
                        getElement("#profit").innerHTML = `<h2>Investment Return: ${Math.round(resJson1.investmentReturn)}</h2>`;
                        getElement("#ROI").innerHTML = `<h2>ROI: ${(Math.floor(resJson1.ROI*10000)/100)}%</h2>`;
                        if (newData.indicator.substr(1 ,2) === "MA") {
                            newData.actionValue = resJson3.actionValue[0];
                            newData.exitValue = resJson3.exitValue[0];
                        }
                        setOrder(newData);
                        window.scrollTo(0, 500);
                    })
                })
            }
        } catch (err) {
            console.log("price fetch failed", err);
        }
    }
)

const setOrder= function (data) {
    const setOrderBtn = getElement("#setOrderBtn");
    setOrderBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        checkLogin(token);
        let data1 = {
            token: token,
            symbol: data.symbol,
            action: "long",
            sub_action: "buy",
            value: data.actionValue,
            category: data.indicator,
            cross: data.actionCross,
            indicatorPeriod: data.indicatorPeriod,
            volume: data.volume,
            period: "90 days"
        }
        let data2 = {
            token: token,
            symbol: data.symbol,
            action: "long",
            sub_action: "sell",
            value: data.exitValue,
            category: data.indicator,
            cross: data.exitCross,
            indicatorPeriod: data.indicatorPeriod,
            volume: data.volume,
            period: "90 days"
        }
        if (data.action === "short") {
            data1.action = "short";
            data1.sub_action = "short";
            data2.action = "short";
            data2.action = "short cover";
        }
        if (data.indicator.substr(1,2) === "MA") {
            data1.value = [data.actionValue, data.exitValue];
            data2.value = [data.exitValue, data.actionValue];
        }
        const res1 = await fetch("/api/1.0/trade/setOrder", {
            method: "POST",
            body: JSON.stringify(data1),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const res2 = await fetch("/api/1.0/trade/setOrder", {
            method: "POST",
            body: JSON.stringify(data2),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resJson1 = (await res1.json()).data;
        const resJson2 = (await res2.json()).data;
        if (!resJson1.error && !resJson2.error) {
            Swal.fire({
                title: "Success!",
                text: "Order places",
                icon: "success",
                confirmButtonText: "Ok"
            });
        }
    })
}

const indicator = getElement(".indicator");
indicator.addEventListener("change", () => {    
    const indicatorPeriods = document.getElementsByClassName("indicatorPeriod");
    for (let i of indicatorPeriods) {
        i.style.display = "inline-block"
    }
    let selectClass;
    if (indicator.value.substr(1,2) === "MA") {
        selectClass = ".MA_test";
    } else if (indicator.value === "price") {
        selectClass = `.price_test`;
        for (let i of indicatorPeriods) {
            i.style.display = "none"
        }
    } else {
        selectClass = `.${indicator.value}_test`;
    }
    getElement(".show").classList.add("hide");
    getElement(".show").classList.remove("show");
    getElement(selectClass).classList.add("show");
    getElement(selectClass).classList.remove("hide");
})


const viewHistoryBtn = getElement("#viewHistoryBtn");
viewHistoryBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    checkLogin(token);
    window.scrollTo(0, 0);
    const data = {
        token: token
    }
    const res = await fetch("/api/1.0/backtest/getSavedResults", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const resJson = (await res.json()).data;
    console.log(resJson)
    if (getElement("#saved_ul")) {
        removeChild("saved_ul");
        createList(`#saved_ul`, "title_li titles", ["Created", "Start", "End", "Symbol", "Indicator", "Action", "ROI"])
    } else {
        const ul = document.createElement("ul");
        ul.id = "saved_ul";
        ul.className = "user_ul";
        getElement("#saved_results").appendChild(ul);
        createList(`#saved_ul`, "title_li titles", ["Created", "Start", "End", "Symbol", "Indicator", "Action", "ROI"])
    }
    removeChild("test_form");
    removeChild("profit");
    removeChild("ROI");
    removeChild("result_container");
    createButton("btn", "goBackBtn", "test_form", "Go back");
    resJson.forEach(i => createList(`#saved_ul`, "user_li saved_li", [i.created_date.substr(0, 10), i.periods[0],i.periods[1], i.symbol, i.indicator, i.action, `${Math.floor(i.ROI*10000)/100}%`]));
    const goBackBtn = getElement("#goBackBtn");
    goBackBtn.addEventListener("click", function(e) {
        e.preventDefault();
        window.location = "/backtest.html";
    })
    console.log(resJson)
    const saved_lis = document.getElementsByClassName("saved_li");
    for (let i =0; i<saved_lis.length; i++) {
        saved_lis[i].addEventListener("click", async function() {
            console.log(saved_lis[i])
            removeChild("profit");
            removeChild("ROI");
            removeChild("result_container");
            if (getElement("#setOrderBtn")) {
                removeItem("setOrderBtn");
            }
            const newData = Object.assign({}, resJson[i]);
            if (newData.indicator.substr(1 ,2) === "MA") {
                newData.actionValue = resJson[i].actionValue[0];
                newData.exitValue = resJson[i].exitValue[0];
            }
            const res1 = await fetch("/api/1.0/backtest/testWithIndicator", {
                method: "POST",
                body: JSON.stringify(newData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resJson1 = (await res1.json()).data;
            console.log(resJson1)
            createButton("btn", "setOrderBtn", "test_form", "Set order with this strategy")
            showResult("result_graph","result_ul", resJson1);
            getElement("#profit").innerHTML = `<h2>Investment Return: ${Math.round(resJson1.investmentReturn)}</h2>`;
            getElement("#ROI").innerHTML = `<h2>ROI: ${(Math.floor(resJson1.ROI*10000)/100)}%</h2>`;
            if (newData.indicator.substr(1 ,2) === "MA") {
                newData.actionValue = parseInt(newData.actionValue[0]);
                newData.exitValue = parseInt(newData.exitValue[0]);
            }
            setOrder(newData);
            window.scrollTo(0, 500);
        })
    }
})


const container = getElement("#indicator_info_container");
container.addEventListener("mouseover", function() {
    getElement("#indicator_info_content").style.display = "block";
});
container.addEventListener("mouseout", function() {
    getElement("#indicator_info_content").style.display = "none";
});


getSymbols();
getInputSymbols();
searchSymbol();