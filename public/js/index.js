import {getElement, createTitle, createList, createListWithLink, removeItem, removeChild, createChart, showLoginBtn, checkLogin, getSymbols, hoverBacktest} from "./utils.js";
//Get Price
window.scrollTo(0, 0);
const token = window.localStorage.getItem("token");
showLoginBtn(token);

let symbols = [];
symbols = getSymbols();

Swal.fire({
    title: "Loading",
    allowOutsideClick: false,
    onBeforeOpen: () => {
        Swal.showLoading()
    },
});

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
    } else {
        createChart(data, "1d");
        const currentPrice = data.prices[data.prices.length-1];
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
async function renderData(symbol, frequency){
    //Chart
    removeChild("priceChart");
    removeChild("profile_ul");
    removeChild("basicInfo_ul");
    removeChild("intro");
    removeChild("show_symbol");
    removeChild("news_ul");
    if (getElement("#news_title")) {
        removeItem("news_title");
    }

    //Watchlist
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
        if (resJson3.error === "Wrong authentication") {
            await Swal.fire({
                title: "Please login again",
                icon: "error",
                confirmButtonText: "Ok",
                timer: "1000"
            });
            localStorage.setItem("page", window.location.href);
            window.location = "/login.html";
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
    previosClosing = resJson1["Previous Closing"]
    const basicInfofilter = Object.keys(resJson1).slice(0,-2).filter(i => resJson1[i] !== null);
    const basicInfoData = basicInfofilter.map(i => [i, resJson1[i]]).reduce((a,b) => a.concat(b));
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

    if (frequency === "1d") {
        socket.connect();
        socket.emit("symbol", symbol);
        
    } else {
        socket.disconnect();
        const res = await fetch(`/api/1.0/stock/getPrices?symbol=${symbol}&frequency=${frequency}`);
        const resJson = (await res.json()).data;
        createChart(resJson, frequency);
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
    swal.close();

    //News
    const res2 = await fetch(`/api/1.0/stock/getNews?symbol=${symbol}`);
    const resJson2 = (await res2.json()).data;
    const news = document.createElement("h2");
    news.innerText = "News";
    news.id = "news_title";
    getElement(".news_container").insertBefore(news, getElement("#news_ul"));
    resJson2.map(i => createListWithLink(`${i.title} | ${i.author} | ${i.time.substr(0,10)}`,i.link));

    //Add trade button
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
                if (sub_action && price && volume && symbol && period) {
                    if (volume%1 !== 0) {
                        swal.close();
                        Swal.fire({
                            title: "Error",
                            text: "Amount needs to be an integer",
                            icon: 'error',
                            confirmButtonText: 'Ok'
                        })
                    } else {
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
                            if (resJson4.error === "Wrong authentication") {
                                await Swal.fire({
                                    title: "Please login again",
                                    icon: "error",
                                    confirmButtonText: "Ok",
                                    timer: "1000"
                                });
                                localStorage.setItem("page", window.location.href);
                                window.location = "/login.html";
                            }
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
                if (resJson5.error === "Wrong authentication") {
                    await Swal.fire({
                        title: "Please login again",
                        icon: "error",
                        confirmButtonText: "Ok",
                        timer: "1000"
                    });
                    localStorage.setItem("page", window.location.href);
                    window.location = "/login.html";
                } else if (resJson5.error) {
                    Swal.fire({
                        title: "Error",
                        text: resJson.error,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    })
                } else {
                    const watchlistBtn = getElement("#watchListBtn");
                    const watchlist = resJson5.watchlist;
                    setWatchlistBtn(watchlist,symbol,watchlistBtn);
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
    // try {
        //Chart
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        const frequency = getElement("#frequency").value;
        if (symbols.map(i => i.symbol).includes(symbol)) {
            renderData(symbol, frequency);
        } else {
            Swal.fire({
                title: "Error",
                text: "Please confirm you entered the right symbol",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
        
    // } catch (err) {
    //     console.log("info fetch failed, err");
    // }
})


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


const expiration = getElement("#expiration");
expiration.addEventListener("mouseover", () => {
    const expiration_info = getElement("#expiration_info");
    expiration_info.style.display = "inline-block"
})

hoverBacktest();