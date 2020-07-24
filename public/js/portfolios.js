import {createList, checkLogin, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getPortfolios();
}
async function getPortfolios() {
    try {
        const data = {
            token: token
        }
        const res = await fetch(`/api/1.0/user/getPortfolios`,{
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
            const portfolios = resJson;
            if (portfolios.length !== 0) {
                portfolios.forEach(i => {
                    i.expense = i.volume * i.price;
                    i.return = (i.current - i.price) * i.volume;
                    i.price = Math.floor(i.price*100)/100;
                    i.current = Math.floor(i.current*100)/100;
                    i.changePercent = `${Math.floor(i.changePercent*10000)/100}%`;
                })
                function showGraph(graphid, values, title) {
                    const pieData = [{
                        values: values,
                        labels: portfolios.map(i => i.symbol),
                        marker: {
                            colors: ["#005662", "#3fa089"]
                        },
                        type: 'pie',
                        hole: .4,
                    }];
                    const pieLayout = {
                        title: title,
                        height: 400,
                        width: 500
                    };
                    Plotly.newPlot(graphid, pieData, pieLayout);
                }
                showGraph("expensePie", portfolios.map(i => i.expense), "Expenses in different stock");
                showGraph("returnPie", portfolios.map(i => i.return), "Return in different stock");
                portfolios.forEach(i => {
                    delete i.expense;
                    delete i.return;
                })
                portfolios.filter(i => i.volume !== 0).map(i => createList("#portfolio_ul", "user_li",Object.values(i)));
            } else {
                alert("You don't have any portfolios yet")
            }
        }
    } catch (err) {
        console.log("Portfolios fetch failed, err");
    }
}


getSymbols();
searchSymbol();