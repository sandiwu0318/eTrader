import {getElement, createTitle, createList, createListWithLink, createForm, removeItem, removeChild, createChart, showLoginBtn, checkLogin, autocomplete, createInput} from "./utils.js";
//Get Price
const token = window.localStorage.getItem("token");
showLoginBtn(token);

const socket = io();
socket.on("intraday", (data) => {
    createChart(data);
});

const searchBtn = getElement("#searchBtn");
searchBtn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        const frequency = getElement("#frequency").value;
        try {
            if (frequency === "1d") {
                socket.emit("symbol", symbol);
            } else {
                const res = await fetch(`/api/1.0/stock/getPrices?symbol=${symbol}&frequency=${frequency}`);
                const resJson = (await res.json()).data;
                createChart(resJson);
            }
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)

//Get basic info, financials, profile
searchBtn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        removeChild("profile_ul");
        removeChild("basicInfo_ul");
        removeChild("intro");
        try {
            const res = await fetch(`/api/1.0/stock/getBasicInfo?symbol=${symbol}`);
            const resJson = (await res.json()).data;
            //Basic info
            const basicInfofilter = Object.keys(resJson).slice(0,-2).filter(i => resJson[i] !== null);
            const basicInfoData = basicInfofilter.map(i => [i, resJson[i]]).reduce((a,b) => a.concat(b));
            createTitle("#basicInfo_ul", "Basic Info");
            createList("#basicInfo_ul", "basic_info", basicInfoData);
            //Financials
            const financials_yearly = resJson.financialChart.yearly;
            const financials_quarterly = resJson.financialChart.quarterly;
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
            financialGraph("financials_Yearly", financials_yearly);
            financialGraph("financials_Quarterly", financials_quarterly);
            //Profile
            delete resJson.profile.zip;
            delete resJson.profile.companyOfficers;
            delete resJson.profile.maxAge;
            const longIntro = resJson.profile.longBusinessSummary;
            delete resJson.profile.longBusinessSummary;
            const profileData = Object.keys(resJson.profile).map(i => [i, resJson.profile[i]]).reduce((a,b) => a.concat(b));
            createTitle("#profile_ul", "Profile");
            createList("#profile_ul", "profile", profileData);
            createTitle("#intro", "Company Intro");
            createList("#intro", "intro", [longIntro]);
        } catch (err) {
            console.log("info fetch failed, err");
        }
    }
)

//Get news
searchBtn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        removeChild("news_ul");
        try {
            const res = await fetch(`/api/1.0/stock/getNews?symbol=${symbol}`);
            const resJson = (await res.json()).data;
            createTitle("#news_ul", "News");
            resJson.map(i => createListWithLink(`${i.title} | ${i.author} | ${i.time.substr(0,10)}`,i.link));
        } catch (err) {
            console.log("news fetch failed, err");
        }
    }
)

//Add trade button
searchBtn.addEventListener("click",() => {
    if (getElement("#tradeForm") !== null) {
        removeItem("tradeForm");
    }
    createForm("tradeForm", ["BuyOrSell", "Price", "Volume", "Expire"], "Trade");
    const btn = document.createElement("button");
    btn.className = "btn add";
    btn.id = "watchListBtn";
    btn.innerText = "Add to watchlist";
    const form = getElement("#tradeForm");
    form.appendChild(btn);
    let tradeBtn = getElement("#Trade");
    tradeBtn.addEventListener("click",
        async function (){
            checkLogin(token);
            if (token !== null) {
                const action = getElement("#BuyOrSell").value;
                const price = getElement("#Price").value;
                const volume = getElement("#Volume").value;
                const symbol = getElement("#symbol_search").value.split(" ")[0];
                const period = getElement("#Expire").value;
                try {
                    const data = {
                        action: action,
                        price: price,
                        volume: volume,
                        symbol: symbol,
                        period: period,
                        token: token
                    }
                    const res = await fetch(`/api/1.0/trade/setOrder`,{
                        method: "POST",
                        body: JSON.stringify(data),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const resJson = (await res.json()).data;
                    alert(resJson.message);
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
                const symbol = getElement("#symbol_search").value.split(" ")[0];
                // try {
                    const data = {
                        symbol: symbol,
                        token: token
                    }
                    const res = await fetch(`/api/1.0/user/addRemoveWatchlist`,{
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
                        alert(`Add ${symbol}  to watchlist`);
                        getElement("#watchListBtn").id = "watchListBtn-added";
                        getElement("#watchListBtn").innerText = "Remove from watchlist";
                    }
                    
                // } catch (err) {
                //     console.log("set watchlist fetch failed, err");
                // }
            }
        }
    )
})

//Autocomplete for symbols
async function getSymbols() {
    const res = (await fetch(`/api/1.0/stock/symbolList`));
    const resJson = (await res.json()).data;
    const symbolList = resJson.map(i => `${i.symbol} (${i.name})`);
    autocomplete(getElement("#symbol_search"), symbolList);
}

getSymbols();
