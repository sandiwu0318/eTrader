import {getElement, createTitle, createList, createListWithLink, removeItem, removeChild, createChart, showLoginBtn, checkLogin, getSymbols, hoverNav} from "./utils.js";
//Get Price
window.scrollTo(0, 0);
const token = window.localStorage.getItem("token");
showLoginBtn(token);

let symbols = [];
symbols = getSymbols();

let watchlist;
let previosClosing = 0;
const socket = io();
socket.on("intraday", (data) => {
    if (data.error) {
        removeChild("priceChart");
        const div = document.createElement("div");
        div.id="unavailable";
        div.innerText = "Daily Price Unavailable";
        getElement("#priceChart").appendChild(div);
        socket.disconnect();
    } else if (data === "disconnect") {
        socket.disconnect();
    } else {
        if (frequency.value === "1d") {
            createChart(data, "1d");
        }
        const currentPrice = data.currentPrice;
        getElement("#current_price").innerText = currentPrice.toFixed(2);
        if (previosClosing !== 0) {
            if (currentPrice - previosClosing > 0) {
                getElement("#change").innerText = `+${(currentPrice - previosClosing).toFixed(2)} (+${((currentPrice / previosClosing -1)*100).toFixed(2)}%)`;
                getElement("#change").classList.add("green_flash");
                setTimeout(() => {
                    getElement("#change").classList.remove("green_flash");
                }, 900);
                getElement("#change").classList.add("green");
                getElement("#change").classList.remove("red");
            } else {
                getElement("#change").innerText = `${(currentPrice - previosClosing).toFixed(2)} (${((currentPrice / previosClosing -1)*100).toFixed(2)}%)`;
                getElement("#change").classList.add("red_flash");
                setTimeout(() => {
                    getElement("#change").classList.remove("red_flash");
                }, 900);
                getElement("#change").classList.add("red");
                getElement("#change").classList.remove("green");
            }
        }
    }
});
async function renderData(symbol){
    //Chart
    Swal.fire({
        title: "Loading",
        allowOutsideClick: false,
        onBeforeOpen: () => {
            Swal.showLoading()
        },
    });
    removeChild("priceChart");
    removeChild("basicInfo_ul");
    removeChild("show_symbol");
    removeChild("financials_Yearly");
    removeChild("financials_Quarterly");
    removeChild("news_ul");
    if (getElement("#news_title")) {
        removeItem("news_title");
    }

    //Watchlist
    if (token) {
        const data = {
            symbolOnly: 1
        }
        const res3 = await fetch(`/api/1.0/user/getWatchlist`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Authorization": `${token}`,
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
        } else if (resJson3.error && resJson3.error !== "You don't have any watchlist yet") {
            Swal.fire({
                title: "Error",
                text: "Internal server error",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
        if (resJson3.length === 0 || resJson3.error === "You don't have any watchlist yet") {
            watchlist = []
        } else {
            watchlist = resJson3[0].watchlist.split(",");
        }
    } else {
        watchlist = []
    }
    const watchlistBtn = getElement("#watchListBtn");
    setWatchlistBtn(watchlist,symbol,watchlistBtn);
    watchlistBtn.addEventListener("mouseover", () => {
        if (watchlistBtn.classList.contains("added")) {
            watchlistBtn.innerText = "\u2661 Watchlist";
        } else {
            watchlistBtn.innerText = "\u2665 Watchlist";
        }
    })
    watchlistBtn.addEventListener("mouseout", () => {
        if (watchlistBtn.classList.contains("added")) {
            watchlistBtn.innerText = "\u2665 Watchlist";
        } else {
            watchlistBtn.innerText = "\u2661 Watchlist";
        }
    })
    
    //Basic info
    getElement("#show_symbol").innerText = symbol;
    symbols = await getSymbols();
    const index = symbols.findIndex(i => i.symbol === symbol);
    getElement("#show_company").innerText = symbols[index].name;
    const res1 = await fetch(`/api/1.0/stock/getBasicInfo?symbol=${symbol}`);
    const resJson1 = (await res1.json()).data;
    if (resJson1.error) {
        Swal.fire({
            title: "Error",
            text: "Internal server error",
            icon: 'error',
            confirmButtonText: 'Ok'
        })
    }
    previosClosing = resJson1["Previous Closing"]
    const basicInfofilter = Object.keys(resJson1).slice(0,-2).filter(i => resJson1[i] !== null);
    const basicInfoData = basicInfofilter.map(i => [i, resJson1[i]]).reduce((a,b) => a.concat(b));
    createTitle("#basicInfo_ul", "Basic Info");
    createList("#basicInfo_ul", "basic_info", basicInfoData);
    //Financials
    if (resJson1.financialChart && Object.entries(resJson1.financialChart).length !== 0) {
        getElement("#financials").style.display = "flex";
        const financials_yearly = resJson1.financialChart.yearly;
        const financials_quarterly = resJson1.financialChart.quarterly;
        financialGraph("financials_Yearly", financials_yearly);
        financialGraph("financials_Quarterly", financials_quarterly);
    } else {
        getElement("#financials").style.display = "none";
    }
    function financialGraph(id, data) {
        const revenueTrace = {
            x: data.map(i => i.date),
            y: data.map(i => i.revenue.longFmt),
            type: "bar",
            name: "Revenue",
            marker: {color: "#3fa089"}
        };
        const earningTrace = {
            x: data.map(i => i.date),
            y: data.map(i => i.earnings.longFmt),
            type: "bar",
            name: "Earnings",
            marker: {color: "#005662"},
        };
        let financialsLayout = {
            title: `${id.substr(11)} Financials`,
            xaxis: {
                title: "Date",
                type: "cateogry",
            },
        }
        const financialsData = [revenueTrace, earningTrace];
        Plotly.newPlot(id, financialsData, financialsLayout);
    }
    const list = document.getElementsByClassName("li_div");
    for (let i = 0; i<list.length; i++) {
        if (i%2 === 0) {
            list[i].className = "li_title li_div";
        }
    }
    Swal.close();

    //News
    const res2 = await fetch(`/api/1.0/stock/getNews?symbol=${symbol}`);
    const resJson2 = (await res2.json()).data;
    if (!resJson2.error) {
        const news = document.createElement("h2");
        news.innerText = "News";
        news.id = "news_title";
        getElement(".news_container").insertBefore(news, getElement("#news_ul"));
        resJson2.map(i => createListWithLink(`${i.title} | ${i.author} | ${i.time.substr(0,10)}`,i.link));
    }
}

//Show prices
async function showPrice(symbol, frequency) {
    if (frequency === "1d") {
        socket.connect();
        socket.emit("symbol", symbol);
    } else {
        const res = await fetch(`/api/1.0/stock/getPrices?symbol=${symbol}&frequency=${frequency}`);
        const resJson = (await res.json()).data;
        if (resJson.error) {
            Swal.fire({
                title: "Error",
                text: "Internal server error",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
        createChart(resJson, frequency);
    }
}

//Search from other pages
const symbol = localStorage.getItem("symbol");
async function showIndexPage(symbol) {
    if (symbol) {
        await renderData(symbol);
        await showPrice(symbol, "1d");
        localStorage.removeItem('symbol');
    } else {
        await renderData("AMZN");
        await showPrice("AMZN", "1d");
    }
}
showIndexPage(symbol);

//Search button
const searchBtn = getElement("#searchBtn");
searchBtn.addEventListener("click", function () {
    try {
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        if (symbols.map(i => i.symbol).includes(symbol)) {
            previosClosing = 0;
            renderData(symbol);
            showPrice(symbol, "1d");
        } else {
            Swal.fire({
                title: "Error",
                text: "Please confirm you entered the right symbol",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
    } catch (err) {
        Swal.fire({
            title: "Error!",
            text: "Internal server error",
            icon: "error",
            confirmButtonText: "Ok"
        });
    }
})

//Add to and Remove from watchlist
let watchListBtn = getElement("#watchListBtn");
watchListBtn.addEventListener("click",
    async function (e){
        e.preventDefault();
        checkLogin(token);
        if (token !== null) {
            const symbol = getElement("#show_symbol").innerText;
            const data = {
                symbol: symbol,
            }
            let res;
            if (!watchlist.includes(symbol)) {
                res = await fetch(`/api/1.0/user/addToWatchlist`,{
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Authorization": `${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                res = await fetch(`/api/1.0/user/removeFromWatchlist`,{
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Authorization": `${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            const resJson = (await res.json()).data;
            if (resJson.error === "Wrong authentication") {
                await Swal.fire({
                    title: "Please login again",
                    icon: "error",
                    confirmButtonText: "Ok",
                    timer: "1000"
                });
                localStorage.setItem("page", window.location.href);
                window.location = "/login.html";
            } else if (resJson.error) {
                Swal.fire({
                    title: "Error",
                    text: "Internal server error",
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
            } else {
                const watchlistBtn = getElement("#watchListBtn");
                watchlist = resJson.watchlist;
                setWatchlistBtn(watchlist,symbol,watchlistBtn);
            }
        }
    }
)

//Trade button
const tradeBtn = getElement("#tradeBtn");
tradeBtn.addEventListener("click",
    async function (e){
        e.preventDefault();
        checkLogin(token);
        if (token !== null) {
            const sub_action = getElement("#action").value;
            const price = getElement("#price").value;
            const volume = getElement("#volume").value;
            const symbol = getElement("#show_symbol").innerText.split(" ")[0];
            const period = getElement("#expiration").value;
            if (sub_action && price && volume && symbol && period) {
                if (volume%1 !== 0 || volume < 0) {
                    Swal.close();
                    Swal.fire({
                        title: "Error",
                        text: "Amount needs to be an integer",
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    })
                } else {
                    try {
                        let tradeData = {
                            sub_action: sub_action,
                            value: price,
                            volume: volume,
                            symbol: symbol,
                            period: period,
                            indicator: "price",
                            cross: null,
                            indicatorPeriod: null,
                        }
                        if (sub_action === "buy" || sub_action === "sell") {
                            tradeData.action = "long";
                        } else {
                            tradeData.action = "short";
                        }
                        const res = await fetch(`/api/1.0/trade/setOrder`,{
                            method: "POST",
                            body: JSON.stringify(tradeData),
                            headers: {
                                "Authorization": `${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const resJson = (await res.json()).data;
                        if (resJson.error === "Wrong authentication") {
                            await Swal.fire({
                                title: "Please login again",
                                icon: "error",
                                confirmButtonText: "Ok",
                                timer: "1000"
                            });
                            localStorage.setItem("page", window.location.href);
                            window.location = "/login.html";
                        } else if (resJson.error) {
                            Swal.fire({
                                title: "Error",
                                text: "Internal server error",
                                icon: 'error',
                                confirmButtonText: 'Ok'
                            })
                        }
                        Swal.fire({
                            title: "Success",
                            text: resJson.message,
                            icon: "success",
                            confirmButtonText: "Ok"
                        })
                    } catch (err) {
                        Swal.fire({
                            title: "Error!",
                            text: "Internal server error",
                            icon: "error",
                            confirmButtonText: "Ok"
                        });
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
    }
)

//Create watchlistBtn
function setWatchlistBtn(watchlist,symbol,btn) {
    if (watchlist.includes(symbol)) {
        btn.className = "btn added";
        btn.innerText = "\u2665 Watchlist";
    } else {
        btn.className = "btn not_added";
        btn.innerText = "\u2661 Watchlist";
    }
}

const frequency = getElement("#frequency");
frequency.addEventListener("change", () => {
    const symbol = getElement("#show_symbol").innerText;
    const frequency_Value = frequency.value;
    showPrice(symbol, frequency_Value);
})


const getTimeForApi = function(today, minusDays, hour, minute) {
    return Math.floor(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()-minusDays, hour, minute)).getTime()/1000);
};

hoverNav();