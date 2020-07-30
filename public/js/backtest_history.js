import {getElement, getDataByClass, showLoginBtn, createList, removeChild, createButton, checkLogin, removeItem, searchSymbol, hoverBacktest} from "./utils.js";
window.scrollTo(0, 0);
const token = window.localStorage.getItem("token");
showLoginBtn(token);


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

async function backtest_history() {
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
    if (resJson.error === "Wrong authentication") {
        await Swal.fire({
            title: "Please login again",
            icon: "error",
            confirmButtonText: "Ok",
            timer: "1000"
        });
        localStorage.setItem("page", window.location.href);
        window.location = "/login.html";
    }
    if (getElement("#saved_ul")) {
        removeChild("saved_ul");
        createButton("btn", "goBackBtn", "saved_results", "Go back");
        createList(`#saved_ul`, "title_li titles", ["Created", "Start", "End", "Symbol", "Indicator", "Action", "ROI"])
    } else {
        createButton("btn", "goBackBtn", "saved_results", "Go back");
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
    resJson.forEach(i => createList(`#saved_ul`, "user_li saved_li", [i.created_date.substr(0, 10), i.periods[0],i.periods[1], i.symbol, i.indicator, i.action, `${Math.floor(i.ROI*10000)/100}%`]));
    const goBackBtn = getElement("#goBackBtn");
    goBackBtn.addEventListener("click", function(e) {
        e.preventDefault();
        window.location = "/backtest.html";
    })
    const saved_lis = document.getElementsByClassName("saved_li");
    for (let i =0; i<saved_lis.length; i++) {
        saved_lis[i].addEventListener("click", async function() {
            removeChild("profit");
            removeChild("ROI");
            removeChild("result_container");
            if (getElement("#setOrderBtn")) {
                removeItem("setOrderBtn");
            }
            const newData = Object.assign({}, resJson[i]);
            const res1 = await fetch("/api/1.0/backtest/testWithIndicator", {
                method: "POST",
                body: JSON.stringify(newData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resJson1 = (await res1.json()).data;
            createButton("btn", "setOrderBtn", "test_form", "Set orders")
            showResult("result_graph","result_ul", resJson1);
            getElement("#profit").innerHTML = `<h2>Investment Return: ${Math.round(resJson1.investmentReturn)}</h2>`;
            getElement("#ROI").innerHTML = `<h2>ROI: ${(Math.floor(resJson1.ROI*10000)/100)}%</h2>`;
            setOrder(newData);
            window.scrollTo(0, 500);
        })
    }
}


searchSymbol();
backtest_history();
hoverBacktest();