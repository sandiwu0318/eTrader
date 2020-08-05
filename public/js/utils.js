function getElement(element) {
    return document.querySelector(element);
}

function getDataByClass(className) {
    const elements = document.getElementsByClassName(className);
    let arr = [];
    for (let i of elements) {
        if (i.value !== "") {
            arr.push(i.value);
        }
    }
    return arr;
}

function createInput(className, id, placeholder, form_id) {
    const input = document.createElement("input");
    const form = getElement(`#${form_id}`);
    input.type = "text";
    input.className = `input ${className}`;
    input.id = id;
    input.placeholder = placeholder;
    form.appendChild(input)
}

function createSelect(className, id, options, form_id) {
    const select = document.createElement("select");
    options.forEach(i => {
        const option = document.createElement("option");
        option.value = i;
        option.innerText = i;
        select.appendChild(option);
    })
    const form = getElement(`#${form_id}`);
    select.className = className;
    select.id = id;
    form.appendChild(select)
}

function createTitle(id, title) {
    const element = getElement(id);
    const h2 = document.createElement("h2")
    h2.innerText = title;
    element.appendChild(h2);
}

function createList(ulId, className, text) {
    const ul = getElement(ulId);
    const li = document.createElement("li");
    li.className = className;
    text.forEach(i => {
        const div = document.createElement("div");
        div.innerText = i;
        div.className = "li_div";
        li.appendChild(div);
        if(i === "\u2716") {
            div.className = "li_div icon";
        }
    })
    ul.appendChild(li);
}

function createListWithLink(text, link) {
    const ul = getElement("#news_ul");
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.innerText = text;
    a.href = link;
    a.target="_blank";
    ul.appendChild(li);
    li.appendChild(a);
}

function createForm(formId, divId) {
    const form = document.createElement("form");
    form.id = formId;
    const div = getElement(`#${divId}`);
    div.appendChild(form);
}

function createButton(className, id, formId, text) {
    const button = document.createElement("button");
    button.className = className;
    button.id = id;
    button.innerText = text;
    const form = getElement(`#${formId}`);
    form.appendChild(button);
}

function removeItem(id) {
    const item = document.getElementById(id);
    item.remove();
}

function removeChild(id) {
    const parent = document.getElementById(id);
    while (parent.hasChildNodes()) {
        parent.removeChild(parent.firstChild);
    }
}

function createChart(data, frequency) {
    const dates = data.times;
    const prices = data.prices;
    const volumes = data.volumes;
    const priceTrace1 = {
        x: dates,
        y: prices,
        mode: "lines",
        type: "scatter",
        name: "price",
        yaxis: "y1",
        marker: {color: "#005662"},
    };
    const priceTrace2 = {
        x: dates,
        y: volumes,
        type: "bar",
        name: "Volume",
        yaxis: "y2",
        marker: {color: "#3fa089"},
    };
    let priceLayout = {
        title: "Stock price",
        xaxis: {
            title: "Date",
            type: "date",
        },
        yaxis1: {
            title: "Price",
            side: "left",
            showline: false,
        },
        yaxis2: {
            title: "Volume",
            side: "right",
            overlaying: "y",
            range: [0, Math.max(...volumes)*1.5],
            showline: false,
            showgrid: false,
        }
    };
    const nowDay = new Date().getUTCDay();
    const nowHours = new Date().getUTCHours();
    const nowMinutes = new Date().getUTCMinutes();
    if (frequency === "1d" && nowDay >=1 && nowDay <= 5 && (nowHours >= 14 && nowHours < 20) || (nowHours === 13 && nowMinutes > 30 && nowMinutes <= 59)) {
        const today = new Date();
        const period1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30);
        const period2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16);
        priceLayout.xaxis.range = [period1, period2];
    }
    const chartData = [priceTrace1, priceTrace2];
    Plotly.newPlot("priceChart", chartData, priceLayout);
}

async function checkLogin(token) {
    console.log(token)
    if (token === null) {
        await Swal.fire({
            title: "Please login first!",
            icon: 'warning',
            showConfirmButton: false,
            timer: "800",
        })
        console.log("11111")
        localStorage.setItem("page", window.location.href);
        window.location = "/login.html";
    } else {
        getElement("#loginBtn").innerText = "Logout";
        getElement("#loginBtn").addEventListener("click", () => {
            localStorage.clear();
            window.location = "/index.html";
            getElement("#loginBtn").innerText = "Login";
        });
    }
}

function showLoginBtn(token) {
    if (token === null) {
        getElement("#loginBtn").addEventListener("click", () => {
            localStorage.setItem("page", window.location.href);
            window.location = "/login.html";    
        });
    } else {
        getElement("#loginBtn").innerText = "Logout";
        getElement("#loginBtn").addEventListener("click", () => {
            localStorage.clear();
            window.location = "/index.html";
            getElement("#loginBtn").innerText = "Login";
        });
    }
}

function autocomplete(inp, arr) {
    let currentFocus;
    inp.addEventListener("input", function(e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        let count = 0;
        for (i = 0; i < arr.length; i++) {
            if (arr[i].toUpperCase().indexOf(val.toUpperCase())!== -1 && count <= 10) {
                const index = arr[i].toUpperCase().indexOf(val.toUpperCase());
                b = document.createElement("DIV");
                if (index !== 0) {
                    b.innerHTML += arr[i].substr(0, index);
                }
                b.innerHTML += "<strong>" + arr[i].substr(index, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(index+val.length, arr[i].length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
                count +=1;
            }
        }
    });
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

let symbols;
async function getSymbols() {
    const res = (await fetch(`/api/1.0/stock/getSymbolList`));
    const resJson = (await res.json()).data;
    const symbolList = resJson.map(i => `${i.symbol} (${i.name})`);
    symbols = resJson.map(i => i.symbol);
    autocomplete(getElement("#symbol_search"), symbolList);
    return resJson;
}

async function getInputSymbols() {
    const res = (await fetch(`/api/1.0/stock/getSymbolList`));
    const resJson = (await res.json()).data;
    const symbolList = resJson.map(i => `${i.symbol} (${i.name})`);
    autocomplete(getElement("#input_symbol_search"), symbolList);
}


function searchSymbol() {
    const searchBtn = getElement("#searchBtn");
    searchBtn.addEventListener("click", function () {
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        if (symbols.includes(symbol)) {
            localStorage.setItem("symbol", symbol);
            window.location = "/";
        } else {
            Swal.fire({
                title: "Error",
                text: "Please confirm you entered the right symbol",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
    })
}

function hoverNav() {
    const backtest_nav = getElement("#backtest_nav");
    const backtest_a = getElement("#backtest_a");
    const backtest_dropdown_div = getElement("#backtest_dropdown_div");
    backtest_nav.addEventListener("mouseover", () => {
        backtest_dropdown_div.style.display = "block";
        backtest_a.classList.add("current");
    })
    backtest_nav.addEventListener("mouseout", () => {
        backtest_dropdown_div.style.display = "none";
        if (location.pathname !== "/backtest.html" && location.pathname !== "/backtest_history.html") {
            backtest_a.classList.remove("current");
        }
    })
    const orders_nav = getElement("#orders_nav");
    const orders_a = getElement("#orders_a");
    const orders_dropdown_div = getElement("#orders_dropdown_div");
    orders_nav.addEventListener("mouseover", () => {
        orders_dropdown_div.style.display = "block";
        orders_a.classList.add("current");
    })
    orders_nav.addEventListener("mouseout", () => {
        orders_dropdown_div.style.display = "none";
        if (location.pathname !== "/orders.html" && location.pathname !== "/history.html") {
            orders_a.classList.remove("current");
        }
    })
}

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
            buyArrow.forEach(i => {
                i.y = exitValue;
            })
            sellArrow.forEach(i => {
                i.y = actionValue;
            })
        }
        if (response.indicator === "RSI") {
            plotData.push(indicatorTrace,indicatorActionTrace1,indicatorActionTrace2);    
        } else {
            indicatorActionTrace1.yaxis = "y1";
            indicatorActionTrace2.yaxis = "y1";
            buyArrow.forEach(i => {
                i.yref = 'y1';
            })
            sellArrow.forEach(i => {
                i.yref = 'y1';
            })
            plotData.push(indicatorActionTrace1,indicatorActionTrace2);    
        }
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
        if (response.action === "short") {
            buyArrow.forEach(i => {
                i.y = exitValue;
            })
            sellArrow.forEach(i => {
                i.y = actionValue;
            }) 
        }
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

function toThousands(num) {
    let number = (num || 0).toString();
    let result = "";
    while (number.length > 3) {
        result = "," + number.slice(-3) + result;
        number = number.slice(0, number.length - 3);
    }
    if (number) { result = number + result; }
    return result;
};

export {
    getElement,
    getDataByClass,
    createInput,
    createSelect,
    createTitle,
    createList,
    createListWithLink,
    createForm,
    createButton,
    removeItem,
    removeChild,
    createChart,
    checkLogin,
    showLoginBtn,
    getSymbols,
    getInputSymbols,
    searchSymbol,
    hoverNav,
    showResult,
    toThousands
};