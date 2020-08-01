import {getElement, getDataByClass, showLoginBtn, createList, removeChild, createButton, checkLogin, removeItem, getSymbols, getInputSymbols, searchSymbol, hoverNav, showResult} from "./utils.js";
window.scrollTo(0, 0);
const token = window.localStorage.getItem("token");
showLoginBtn(token);

//Show graphs of indicators
const showGraphBtn = getElement("#showGraphBtn");
showGraphBtn.addEventListener("click",
    async function (){
        Swal.fire({
            title: "Loading",
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading()
            },
        });
        const symbol = getDataByClass("symbol")[0] || "";
        let data = {
                periods: getDataByClass("period"),
                symbol: symbol.split(" ")[0],
                indicator: getElement(".indicator").value,
                indicatorPeriod: parseInt(getDataByClass("indicatorPeriod")[1]),
            }
        if (!symbols.includes(data.symbol)) {
            swal.close();
            Swal.fire({
                title: "Error",
                text: "Please confirm you entered the right symbol",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        } else if ((data.periods.length === 2 && data.symbol) && ((data.indicator !== "price" && data.indicatorPeriod) || (data.indicator === "price"))) {
            if (data.indicator !== "price" && (new Date(data.periods[1]).getTime() - new Date(data.periods[0]).getTime() < data.indicatorPeriod*1000*60*60*24)) {
                swal.close();
                Swal.fire({
                    title: "Error",
                    text: "Date range needs to be longer than indicator period",
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
            } else {
                removeChild("result_container");
                removeChild("quantity");
                removeChild("profit");
                removeChild("ROI");
                removeChild("graph_container");
                if (getElement("#setOrderBtn")) {
                    removeItem("setOrderBtn");
                }
                if (getElement("#saveBtn")) {
                    removeItem("saveBtn");
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
                    swal.close();
                    if (resJson.error) {
                        Swal.fire({
                            title: "Error!",
                            text: "Internal server error",
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
                        getElement("#backtest_container").style.display = "block";
                        showGraph("chart", resJson);
                        scrollTo(0, 500);
                    }
                } catch (err) {
                    console.log("price fetch failed", err);
                }
            }
        } else {
            Swal.fire({
                title: "Error",
                text: "Please make sure you filled out all the input",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
    }
)

const backtestBtn = getElement("#backtestBtn");
backtestBtn.addEventListener("click",
    async function (){
        Swal.fire({
            title: "Loading",
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading()
            },
        });
        const indicator = getElement(".indicator").value;
        let indicator_test;
        let data = {
            periods: getDataByClass("period"),
            symbol: getDataByClass("symbol")[0].split(" ")[0],
            action: getElement(".action").value,
            volume: getElement(".volume").value,
            indicator: indicator,
            indicatorPeriod: document.getElementsByClassName("indicatorPeriod")[1].value,
        };
        if (indicator.substr(1 ,2) === "MA") {
            indicator_test = "MA_test";
            const values = getDataByClass(indicator_test).slice(1);
            data.actionValue = values[0];
            data.actionCross = values[1];
            data.exitValue = values[2];
            data.exitCross = values[4];
        } else if (indicator === "BB") {
            indicator_test = "BB_test";
            const values = getDataByClass(indicator_test).slice(1);
            data.actionValue = values[1];
            data.actionCross = values[0];
            data.exitValue = values[3];
            data.exitCross = values[2];
        } else {
            indicator_test = `${indicator}_test`;
            const values = getDataByClass(indicator_test).slice(1);
            data.actionValue = values[1];
            data.actionCross = values[0];
            data.exitValue = values[3];
            data.exitCross = values[2];
        }
        if (!symbols.includes(data.symbol)) {
            Swal.fire({
                title: "Error",
                text: "Please confirm you entered the right symbol",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        } else if ((data.periods.length === 2 && data.symbol) && data.volume && data.actionValue && data.exitValue && ((data.indicator !== "price" && data.indicatorPeriod) || (data.indicator === "price"))) {
            if (data.indicator !== "price" && (new Date(data.periods[1]).getTime() - new Date(data.periods[0]).getTime() < data.indicatorPeriod*1000*60*60*24)) {
                swal.close();
                Swal.fire({
                    title: "Error",
                    text: "Date range needs to be longer than indicator period",
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
            } else if (data.volume%1 !== 0) {
                swal.close();
                Swal.fire({
                    title: "Error",
                    text: "Amount needs to be an integer",
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
            } else {
                removeChild("result_container");
                removeChild("graph_container");
                removeChild("quantity");
                removeChild("profit");
                removeChild("ROI");
                if (getElement("#setOrderBtn")) {
                    removeItem("setOrderBtn");
                }
                if (getElement("#saveBtn")) {
                    removeItem("saveBtn");
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
                    swal.close();
                    if (resJson.error) {
                        Swal.fire({
                            title: "Error!",
                            text: "Internal server error",
                            icon: "error",
                            confirmButtonText: "Ok"
                        });
                    } else {
                        createButton("btn", "saveBtn", "backtest_container", "Save")
                        createButton("btn", "setOrderBtn", "backtest_container", "Set orders")
                        showResult("result_graph","result_ul", resJson);
                        getElement("#quantity").innerHTML = `<h2>Quantity: ${Math.round(resJson.volume)}</h2>`;
                        getElement("#profit").innerHTML = `<h2>Investment Return: ${Math.round(resJson.investmentReturn)}</h2>`;
                        getElement("#ROI").innerHTML = `<h2>ROI: ${(resJson.ROI*100).toFixed(2)}%</h2>`;
                        setOrder(data);
                        scrollTo(0, 800);
                        const saveBtn = getElement("#saveBtn");
                        saveBtn.addEventListener("click", async function (e) {
                            e.preventDefault();
                            if (!token) {
                                checkLogin(token);    
                            } else {
                                window.scrollTo(0, 0);
                                let data3 = Object.assign({}, data);
                                data3.token = token;
                                data3.investmentReturn = resJson.investmentReturn;
                                data3.ROI = resJson.ROI || 0;
                                const res3 = await fetch("/api/1.0/backtest/saveBacktestResult", {
                                    method: "POST",
                                    body: JSON.stringify(data3),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });
                                const resJson3 = (await res3.json()).data;
                                if (resJson3.error === "Wrong authentication") {
                                    await Swal.fire({
                                        title: "Please login again",
                                        icon: "error",
                                        confirmButtonText: "Ok",
                                        timer: "1000"
                                    });
                                    localStorage.setItem("page", window.location.href);
                                    window.location = "/login.html";
                                } else if (resJson3.error) {
                                    await Swal.fire({
                                        title: "Error",
                                        text: "Internal server error",
                                        icon: 'error',
                                        confirmButtonText: 'Ok'
                                    });
                                }
                                if (!getElement("#saved_ul")) {
                                    const ul = document.createElement("ul");
                                    ul.id = "saved_ul";
                                    ul.className = "user_ul";
                                    getElement("#saved_results").appendChild(ul);
                                    createList(`#saved_ul`, "title_li titles", ["Created","Start", "End", "Symbol", "Indicator", "Action", "ROI"])
                                }
                                createList(`#saved_ul`, "user_li saved_li", [resJson3.created_date.substr(0, 10), resJson3.periods[0],resJson3.periods[1], resJson3.symbol, resJson3.indicator, resJson3.action, `${(resJson3.ROI*100).toFixed(2)}%`]);
                                const saved_lis = document.getElementsByClassName("saved_li");
                                saved_lis[saved_lis.length-1].addEventListener("click", async function() {
                                    removeChild("quantity");
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
                                    if (resJson1.error) {
                                        Swal.fire({
                                            title: "Error!",
                                            text: "Internal server error",
                                            icon: "error",
                                            confirmButtonText: "Ok"
                                        });
                                    }
                                    showResult("result_graph","result_ul", resJson1);
                                    createButton("btn", "setOrderBtn", "backtest_container", "Set orders")
                                    getElement("#quantity").innerHTML = `<h2>Quantity: ${Math.round(resJson1.volume)}</h2>`;
                                    getElement("#profit").innerHTML = `<h2>Investment Return: ${Math.round(resJson1.investmentReturn)}</h2>`;
                                    getElement("#ROI").innerHTML = `<h2>ROI: ${(resJson1.ROI*100).toFixed(2)}%</h2>`;
                                    if (newData.indicator.substr(1 ,2) === "MA") {
                                        newData.actionValue = resJson3.actionValue[0];
                                        newData.exitValue = resJson3.exitValue[0];
                                    }
                                    setOrder(newData);
                                    window.scrollTo(0, 500);
                                })
                            }
                        })
                    }
                } catch (err) {
                    console.log("price fetch failed", err);
                }
            }    
        } else {
            Swal.fire({
                title: "Error",
                text: "Please make sure you filled out all the input",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
    }
)

const setOrder = function (data) {
    const setOrderBtn = getElement("#setOrderBtn");
    setOrderBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        if (!token) {
            checkLogin(token);
        } else {
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
                data1.value = [parseInt(data.actionValue), parseInt(data.exitValue)];
                data2.value = [parseInt(data.exitValue), parseInt(data.actionValue)];
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
            } else if (resJson1.error || resJson2.error) {
                Swal.fire({
                    title: "Error!",
                    text: "Internal server error",
                    icon: "error",
                    confirmButtonText: "Ok"
                });
            }
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


const container = getElement("#indicator_info_container");
container.addEventListener("mouseover", function() {
    getElement("#indicator_info_content").style.display = "block";
});
container.addEventListener("mouseout", function() {
    getElement("#indicator_info_content").style.display = "none";
});


const MA_action_actionValue = getElement("#MA_actionValue_input");
const MA_exit_actionValue = getElement("#MA_actionValue");
MA_action_actionValue.addEventListener("input", (e) => {
    MA_exit_actionValue.value = e.target.value;
})
const MA_action_exitValue = getElement("#MA_exitValue_input");
const MA_exit_exitValue = getElement("#MA_exitValue");
MA_action_exitValue.addEventListener("input", (e) => {
    MA_exit_exitValue.value = e.target.value;
})


const action = getElement(".action");
action.addEventListener("change", () => {
    getElement("#RSI_actionValue_input").value = "";
    getElement("#RSI_exitValue_input").value = "";
    getElement("#MA_actionValue_input").value = "";
    getElement("#MA_actionValue_input").value = "";
    if (action.value === "short") {
        getElement("#RSI_actionValue_input").placeholder = "ex. 70";
        getElement("#RSI_exitValue_input").placeholder = "ex. 30";
        getElement("#BB_actionValue").selectedIndex = 2;
        getElement("#BB_exitValue").selectedIndex = 2;
        getElement("#MA_exitValue_input").placeholder = "ex. 14";
        getElement("#MA_exitValue_input").placeholder = "ex. 6";
    } else {
        getElement("#RSI_actionValue_input").placeholder = "ex. 30";
        getElement("#RSI_exitValue_input").placeholder = "ex. 70";
        getElement("#BB_actionValue").selectedIndex = 0;
        getElement("#BB_exitValue").selectedIndex = 0;
        getElement("#MA_actionValue_input").placeholder = "ex. 6";
        getElement("#MA_exitValue_input").placeholder = "ex. 14";
    }
})

let symbols;
async function SymbolList() {
    symbols = (await getSymbols()).map(i => i.symbol);
}

SymbolList();
getInputSymbols();
searchSymbol();
hoverNav();