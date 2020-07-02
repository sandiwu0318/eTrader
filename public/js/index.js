function getElement(element) {
    return document.querySelector(element);
}

function createList(ulId, id, text) {
    const ul = getElement(ulId);
    const li = document.createElement("li");
    li.id = id;
    li.innerText = text;
    ul.appendChild(li);
}

function createListWithLink(text, link) {
    const ul = getElement("#news_ul");
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.innerText = text;
    a.href = link;
    ul.appendChild(li);
    li.appendChild(a);
}

function createForm(formId, inputArr, button) {
    const form = document.createElement("form");
    inputArr.map(i => {
        const input = document.createElement("input");
        input.id = i;
        input.placeholder = i;
        form.appendChild(input);
    })
    const btn = document.createElement("button");
    const div = getElement("#trade");
    form.id = formId;
    btn.id = button;
    btn.type = "button";
    btn.innerText = button;
    div.appendChild(form);
    form.appendChild(btn);
}

//Get Price
const btn = getElement("#btn");
btn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol").value;
        const frequency = getElement("#frequency").value;
        try {
            const res = await fetch(`/api/1.0/stock/getStockPrice?symbol=${symbol}&frequency=${frequency}`);
            const resJson = await res.json();
            const dates = resJson.data.times;
            const prices = resJson.data.prices;
            const volumes = resJson.data.volumes;
            const priceTrace1 = {
                x: dates,
                y: prices,
                mode: "lines",
                type: "scatter",
                name: "price",
                yaxis: "y1"
            };
            const priceTrace2 = {
                x: dates,
                y: volumes,
                type: "bar",
                name: "Volume",
                yaxis: "y2"
            };
            let priceLayout = {
                title: "Stock price",
                xaxis: {
                    title: "Date",
                    type: "date",
                    rangebreaks: [{
                        pattern: "day of week",
                        bounds: [6, 1]
                    }],
                },
                yaxis1: {
                    title: "Price",
                    side: "left"
                },
                yaxis2: {
                    title: "Volume",
                    side: "right",
                    overlaying: "y",
                    range: [0, Math.max(...volumes)*2]
                }
            };
            if (frequency === "1d") {
                priceLayout.xaxis.rangebreaks[0].pattern = "hour";
                priceLayout.xaxis.rangebreaks[0].bounds = [16.1, 9.58];
            }
            const chartData = [priceTrace1, priceTrace2];
            Plotly.newPlot("priceChart", chartData, priceLayout);
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)

//Get basic info, financials, profile
btn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol").value;
        try {
            const res = await fetch(`/api/1.0/stock/getBasicInfo?symbol=${symbol}`);
            const resJson = (await res.json()).data;
            //Basic info
            const basicInfoKeys = Object.keys(resJson);
            basicInfoKeys.slice(0,-2).filter(i => resJson[i] !== {}).map(i => createList("#basicInfo_ul", i, `${i}: ${resJson[i]}`));
            //Financials
            const financials_yearly = resJson.financialChart.yearly;
            const financials_quarterly = resJson.financialChart.quarterly;
            function financialGraph(id, data) {
                const revenueTrace = {
                    x: data.map(i => i.date),
                    y: data.map(i => i.revenue.longFmt),
                    type: "bar",
                    name: "Revenue",
                };
                const earningTrace = {
                    x: data.map(i => i.date),
                    y: data.map(i => i.earnings.longFmt),
                    type: "bar",
                    name: "Earnings",
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
            profileKeys.map(i => createList("#profile_ul", i, `${i}: ${resJson.profile[i]}`));
        } catch (err) {
            console.log("info fetch failed, err");
        }
    }
)

//Get news
btn.addEventListener("click",
    async function (){
        const symbol = getElement("#symbol").value;
        try {
            const res = await fetch(`/api/1.0/stock/getNews?symbol=${symbol}`);
            const resJson = (await res.json()).data;
            resJson.map(i => createListWithLink(`${i.title} | ${i.author} | ${i.time}`,i.link));
        } catch (err) {
            console.log("news fetch failed, err");
        }
    }
)

//Add trade button
btn.addEventListener("click",() => {
    createForm("tradeForm", ["BuyOrSell", "Price", "Volume", "Expire"], "Trade");
    let tradeBtn = getElement("#Trade");
    tradeBtn.addEventListener("click",
        async function (){
            const action = getElement("#BuyOrSell").value;
            const price = getElement("#Price").value;
            const volume = getElement("#Volume").value;
            const symbol = getElement("#symbol").value;
            const period = getElement("#Expire").value;
            console.log(action, price, volume, symbol);
            try {
                console.log(action, price, volume, symbol);
                const data = {
                    action: action,
                    price: price,
                    volume: volume,
                    symbol: symbol,
                    period: period,
                    id: 1
                }
                const res = await fetch(`/api/1.0/trade/setOrder`,{
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json'
                      }
                });
                const resJson = (await res.json()).data;
            } catch (err) {
                console.log("set order fetch failed, err");
            }
        }
    )
})
