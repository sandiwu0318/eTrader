import {getElement, createTitle, createList, createListWithLink, createForm, removeItem, removeChild, createChart, showLoginBtn, checkLogin, createInput, createSelect, createButton, getSymbols} from "./utils.js";
//Get Price
window.scrollTo(0, 0);
const token = window.localStorage.getItem("token");
showLoginBtn(token);

const socket = io();
socket.on("intraday", (data) => {
    if (data.error) {
        removeChild("priceChart");
        const div = document.createElement("div");
        div.id="unavailable";
        div.innerText = "Daily Price Unavailable";
        getElement("#priceChart").appendChild(div);
        socket.disconnect();
    } else {
        createChart(data, "1d");
    }
});
async function renderData(symbol, frequency){
    //Chart
    removeChild("priceChart");
    removeChild("profile_ul");
    removeChild("basicInfo_ul");
    removeChild("intro");
    removeChild("show_symbol");
    removeChild("news_ul");

    if (frequency === "1d") {
        socket.connect();
        socket.emit("symbol", symbol);
    } else {
        socket.disconnect();
        const res = await fetch(`/api/1.0/stock/getPrices?symbol=${symbol}&frequency=${frequency}`);
        const resJson = (await res.json()).data;
        createChart(resJson, frequency);
    }

    //Basic info
    const res1 = await fetch(`/api/1.0/stock/getBasicInfo?symbol=${symbol}`);
    const resJson1 = (await res1.json()).data;
    const basicInfofilter = Object.keys(resJson1).slice(0,-2).filter(i => resJson1[i] !== null);
    const basicInfoData = basicInfofilter.map(i => [i, resJson1[i]]).reduce((a,b) => a.concat(b));
    getElement("#show_symbol").innerText = symbol;
    createTitle("#basicInfo_ul", "Basic Info");
    createList("#basicInfo_ul", "basic_info", basicInfoData);
    
    //Financials
    if (resJson1.financialChart) {
        const financials_yearly = resJson1.financialChart.yearly;
        const financials_quarterly = resJson1.financialChart.quarterly;
        financialGraph("financials_Yearly", financials_yearly);
        financialGraph("financials_Quarterly", financials_quarterly);
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
    
    //Profile
    delete resJson1.profile.zip;
    delete resJson1.profile.companyOfficers;
    delete resJson1.profile.maxAge;
    const longIntro = resJson1.profile.longBusinessSummary;
    delete resJson1.profile.longBusinessSummary;
    const profileData = Object.keys(resJson1.profile).map(i => [i, resJson1.profile[i]]).reduce((a,b) => a.concat(b));
    createTitle("#profile_ul", "Profile");
    createList("#profile_ul", "profile", profileData);
    createTitle("#intro", "Company Intro");
    createList("#intro", "intro", [longIntro]);
    const list = document.getElementsByClassName("li_div");
    for (let i = 0; i<list.length; i++) {
        if (i%2 === 0) {
            list[i].className = "li_title li_div";
        }
    }

    //News
    const res2 = await fetch(`/api/1.0/stock/getNews?symbol=${symbol}`);
    const resJson2 = (await res2.json()).data;
    const news = document.createElement("h2");
    news.innerText = "News";
    getElement(".news_container").insertBefore(news, getElement("#news_ul"));
    resJson2.map(i => createListWithLink(`${i.title} | ${i.author} | ${i.time.substr(0,10)}`,i.link));

    //Add trade button
    if (getElement("#tradeForm") !== null) {
        removeItem("tradeForm");
    }
    createForm("tradeForm", "trade");
    createSelect("input", "action", ["buy", "sell", "short", "short cover"], "tradeForm");
    createInput("price", "price", "Price", "tradeForm");
    createInput("volume", "volume", "volume", "tradeForm");
    createSelect("input", "expiration", ["1 day", "90 days"], "tradeForm");
    createButton("btn", "tradeBtn", "tradeForm", "Set Order");
    let watchlist;
    if (token) {
        const data = {
            token: token,
            symbolOnly: 1
        }
        const res3 = await fetch(`/api/1.0/user/getWatchlist`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resJson3 = (await res3.json()).data;
        if (resJson3.length === 0) {
            watchlist = []
        } else {
            watchlist = resJson3[0].watchlist.split(",");
        }
    } else {
        watchlist = []
    }
    const btn = document.createElement("button");
    btn.id = "watchListBtn";
    setWatchlistBtn(watchlist,symbol,btn);
    const form = getElement("#tradeForm");
    form.appendChild(btn);
    let tradeBtn = getElement("#tradeBtn");
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
                try {
                    let data = {
                        sub_action: sub_action,
                        value: price,
                        volume: volume,
                        symbol: symbol,
                        period: period,
                        token: token,
                        category: "price",
                        cross: null,
                        indicatorPeriod: null,
                    }
                    if (sub_action === "buy" || sub_action === "sell") {
                        data.action = "long";
                    } else {
                        data.action = "short";
                    }
                    const res4 = await fetch(`/api/1.0/trade/setOrder`,{
                        method: "POST",
                        body: JSON.stringify(data),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const resJson4 = (await res4.json()).data;
                    Swal.fire({
                        title: "Success",
                        text: resJson4.message,
                        icon: "success",
                        confirmButtonText: "Ok"
                    })
                } catch (err) {
                    console.log("set order fetch failed, err");
                }
            }
        }
    )
    let watchListBtn = getElement("#watchListBtn");
    watchListBtn.addEventListener("click",
        async function (e){
            e.preventDefault();
            checkLogin(token);
            if (token !== null) {
                const symbol = getElement("#show_symbol").innerText;
                const data = {
                    symbol: symbol,
                    token: token
                }
                const res5 = await fetch(`/api/1.0/user/addRemoveWatchlist`,{
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const resJson5 = (await res5.json()).data;
                if (resJson5.error) {
                    Swal.fire({
                        title: "Error",
                        text: resJson.error,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    })
                } else {
                    const btn = getElement("#watchListBtn");
                    const watchlist = resJson5.watchlist;
                    setWatchlistBtn(watchlist,symbol,btn);
                }
            }
        }
    )
}

const symbol = localStorage.getItem("symbol");
const frequency = localStorage.getItem("frequency")
if (symbol && frequency) {
    renderData(symbol, frequency);
    localStorage.removeItem('symbol');
    localStorage.removeItem('frequency');

} else {
    renderData("AMZN", "1d")
}

const searchBtn = getElement("#searchBtn");
searchBtn.addEventListener("click", function () {
    try {
        //Chart
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        const frequency = getElement("#frequency").value;
        renderData(symbol, frequency);
    } catch (err) {
        console.log("info fetch failed, err");
    }
})


//Create watchlistBtn
function setWatchlistBtn(watchlist,symbol,btn) {
    if (watchlist.includes(symbol)) {
        btn.className = "btn added";
        btn.innerText = "- watchlist";
    } else {
        btn.className = "btn not_added";
        btn.innerText = "+ watchlist";
    }
}

getSymbols();
