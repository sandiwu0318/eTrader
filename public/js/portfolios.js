import {createList, checkLogin, getSymbols, searchSymbol, hoverNav, getElement, removeItem} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getPortfolios();
    Swal.fire({
        title: "Loading",
        allowOutsideClick: false,
        onBeforeOpen: () => {
            Swal.showLoading()
        },
    });
}
async function getPortfolios() {
    try {
        const res = await fetch(`/api/1.0/user/getPortfolios`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Authorization": `${token}`,
                'Content-Type': 'application/json'
            }
        });
        const resJson = (await res.json()).data;
        if (data.error === "Wrong authentication") {
            swal.close();
            await Swal.fire({
                title: "Please login again",
                icon: "error",
                confirmButtonText: "Ok",
                timer: "1000"
            });
            localStorage.setItem("page", window.location.href);
            window.location = "/login.html";
        } else if (resJson.error === "You don't have any portfolios yet") {
            removeItem("expensePie");
            removeItem("returnPie");
            swal.close();
            Swal.fire({
                text: resJson.error,
                icon: 'warning',
                confirmButtonText: 'Ok'
            })
            const reminder = document.createElement("div");
            reminder.className = "reminder";
            reminder.innerHTML = "You can place orders with prices or indicators. <br>Already placed orders? Your portfolio will be shown when the deal is done."
            getElement("#portfolio_ul").appendChild(reminder);
        } else if (resJson.error) {
            Swal.fire({
                title: "Error",
                text: "Internal server error",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        } else {
            swal.close();
            const portfolios = resJson;
            if (portfolios.length !== 0) {
                for (let i of portfolios) {
                    if (i.action === "long") {
                        const expectedReturn = (i.current - i.price) * i.volume;
                        if (expectedReturn > 0) {
                            i.expectedReturn = expectedReturn;
                        } else {
                            i.expectedReturn = 0;
                        }
                    } else if (i.action === "short") {
                        const expectedReturn = (i.price - i.current) * i.volume;
                        if (expectedReturn > 0) {
                            i.expectedReturn = expectedReturn;
                        } else {
                            i.expectedReturn = 0;
                        }
                    }
                }
                portfolios.forEach(i => {
                    i.expense = i.volume * i.price;
                    i.price = i.price.toFixed(2);
                    i.current = i.current.toFixed(2);
                    i.changePercent = `${(i.changePercent*100).toFixed(2)}%`;
                    i.expectedReturn = i.expectedReturn;
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
                const returnChartLength = portfolios.filter(i => i.expectedReturn > 0);
                const returnChart = portfolios.map(i => i.expectedReturn);
                if (returnChartLength.length !== 0) {
                    showGraph("returnPie", returnChart, "Return in different stock");
                }
                portfolios.forEach(i => {
                    delete i.expense;
                    delete i.expectedReturn;
                })
                portfolios.filter(i => i.volume !== 0).map(i => createList("#portfolio_ul", "user_li",Object.values(i)));
            } else {
                removeItem("expensePie");
                removeItem("returnPie");
                Swal.fire({
                    text: "You don't have any portfolios yet",
                    icon: "warning",
                    confirmButtonText: "Ok"
                })
                const reminder = document.createElement("div");
                reminder.className = "reminder";
                reminder.innerText = "You can place orders with prices or indicators. Already placed orders? Your portfolio will be shown when the deal is done."
                getElement("#portfolio_ul").appendChild(reminder);
            }
        }
    } catch (err) {
        Swal.fire({
            title: "Error!",
            text: "Internal server error",
            icon: "error",
            confirmButtonText: "Ok"
        });
    }
}


let symbols;
async function getSymbolList() {
    symbols = await getSymbols();
}

getSymbolList();
searchSymbol();
hoverNav();