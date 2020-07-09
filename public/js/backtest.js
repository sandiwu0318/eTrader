import {getElement, getDataByClass, createInput, createSelect, loginBtn} from "./utils.js";
const id = window.localStorage.getItem("id");
if (id !== null) {
    getElement("#loginBtn").innerText = "Logout";
    getElement("#loginBtn").addEventListener("click", () => localStorage.clear());
} else {
    loginBtn();
}
const backtestBtn = getElement("#backtestBtn");
backtestBtn.addEventListener("click",
    async function (){
        const data = {
            periods: getDataByClass("period"),
            symbols: getDataByClass("symbol"),
            indicators: getDataByClass("indicator"),
            indicatorPeriods: getDataByClass("indicatorPeriod"),
            actions: getDataByClass("action"),
            volumes: getDataByClass("volume"),
            actionValues: getDataByClass("actionValue"),
            exitValues: getDataByClass("exitValue"),
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
            if (resJson.error) {
                alert(resJson.error);
            } else {
                console.log(resJson)
            }
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)

//Add more stock
const addSymbolBtn = getElement("#addSymbolBtn");
addSymbolBtn.addEventListener("click", function() {
    createInput("symbol");
    createInput("action");
    createSelect("indicator",["RSI", "SMA", "EMA", "WMA"]);
    createInput("indicatorPeriod");
    createInput("volume");
    createInput("actionValue");
    createInput("exitValue");
});