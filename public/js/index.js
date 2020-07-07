import {getElement, createTitle, createList, createListWithLink, createForm, removeItem, removeChild, createChart} from "./utils.js";
//Get Price

const searchBtn = getElement("#searchBtn");
searchBtn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol_search").value;
        const frequency = getElement("#frequency").value;
        try {
            if (frequency === "1d") {
                const socket = io();
                socket.on("connect", () => {
                    console.log("connect");
                    fetch(`/api/1.0/stock/getIntradayPrices?symbol=${symbol}`);
                });
                socket.on("intraday", (data) => {
                    console.log(data);
                    createChart(data);
                });
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
        const symbol = getElement("#symbol_search").value;
        removeChild("profile_ul");
        removeChild("basicInfo_ul");
        try {
            const res = await fetch(`/api/1.0/stock/getBasicInfo?symbol=${symbol}`);
            const resJson = (await res.json()).data;
            //Basic info
            const basicInfoKeys = Object.keys(resJson);
            createTitle("#basicInfo_ul", "Basic Info");
            basicInfoKeys.slice(0,-2).filter(i => resJson[i] !== null).map(i => createList("#basicInfo_ul", i, `${i}: ${resJson[i]}`));
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
            const profileKeys = Object.keys(resJson.profile);
            createTitle("#profile_ul", "Profile");
            profileKeys.map(i => createList("#profile_ul", i, `${i}: ${resJson.profile[i]}`));
        } catch (err) {
            console.log("info fetch failed, err");
        }
    }
)

//Get news
searchBtn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol_search").value;
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
    let tradeBtn = getElement("#Trade");
    tradeBtn.addEventListener("click",
        async function (){
            const action = getElement("#BuyOrSell").value;
            const price = getElement("#Price").value;
            const volume = getElement("#Volume").value;
            const symbol = getElement("#symbol").value;
            const period = getElement("#Expire").value;
            let id = 1;
            try {
                const data = {
                    action: action,
                    price: price,
                    volume: volume,
                    symbol: symbol,
                    period: period,
                    id: id
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
    )
})
