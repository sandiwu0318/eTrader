import {getElement, createList, createListWithLink, createForm,} from "./utils.js";
let id = 1;
async function getPortfolios() {
    try {
        const data = {
            id: id
        }
        const res = await fetch(`/api/1.0/user/getOrders`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resJson = (await res.json()).data;
        
        const portfolios = resJson.portfolio;
        portfolios.forEach(i => i.expense = i.volume * i.averagePrice);
        portfolios.map(i => createList("#portfolio_ul", "user_li",Object.values(i)));
        const pieData = [{
            values: portfolios.map(i => i.expense),
            labels: portfolios.map(i => i.symbol),
            marker: {
                colors: ["#005662", "#3fa089"]
            },
            type: 'pie',
            hole: .4,
        }];
        const pieLayout = {
            title: 'Expenses in different stock',
            height: 400,
            width: 500
        };
        Plotly.newPlot('portfolioPie', pieData, pieLayout);
    } catch (err) {
        console.log("Portfolios fetch failed, err");
    }
}
getPortfolios();