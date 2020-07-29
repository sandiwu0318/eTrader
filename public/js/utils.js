function getElement(element) {
    return document.querySelector(element);
}

function getDataByClass(className) {
    const elements = document.getElementsByClassName(className);
    let arr = [];
    for (let i of elements) {
        if (i.value !== "") {
            arr.push(i.value);
        }
    }
    return arr;
}

function createInput(className, id, placeholder, form_id) {
    const input = document.createElement("input");
    const form = getElement(`#${form_id}`);
    input.type = "text";
    input.className = `input ${className}`;
    input.id = id;
    input.placeholder = placeholder;
    form.appendChild(input)
}

function createSelect(className, id, options, form_id) {
    const select = document.createElement("select");
    options.forEach(i => {
        const option = document.createElement("option");
        option.value = i;
        option.innerText = i;
        select.appendChild(option);
    })
    const form = getElement(`#${form_id}`);
    select.className = className;
    select.id = id;
    form.appendChild(select)
}

function createTitle(id, title) {
    const element = getElement(id);
    const h2 = document.createElement("h2")
    h2.innerText = title;
    element.appendChild(h2);
}

function createList(ulId, className, text) {
    const ul = getElement(ulId);
    const li = document.createElement("li");
    li.className = className;
    text.forEach(i => {
        const div = document.createElement("div");
        div.innerText = i;
        div.className = "li_div";
        li.appendChild(div);
    })
    ul.appendChild(li);
}

function createListWithLink(text, link) {
    const ul = getElement("#news_ul");
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.innerText = text;
    a.href = link;
    a.target="_blank";
    ul.appendChild(li);
    li.appendChild(a);
}

function createForm(formId, divId) {
    const form = document.createElement("form");
    form.id = formId;
    const div = getElement(`#${divId}`);
    div.appendChild(form);
}

function createButton(className, id, formId, text) {
    const button = document.createElement("button");
    button.className = className;
    button.id = id;
    button.innerText = text;
    const form = getElement(`#${formId}`);
    form.appendChild(button);
}

function removeItem(id) {
    const item = document.getElementById(id);
    item.remove();
}

function removeChild(id) {
    const parent = document.getElementById(id);
    while (parent.hasChildNodes()) {
        parent.removeChild(parent.firstChild);
    }
}

function createChart(data, frequency) {
    const dates = data.times;
    const prices = data.prices;
    const volumes = data.volumes;
    const priceTrace1 = {
        x: dates,
        y: prices,
        mode: "lines",
        type: "scatter",
        name: "price",
        yaxis: "y1",
        marker: {color: "#005662"},
    };
    const priceTrace2 = {
        x: dates,
        y: volumes,
        type: "bar",
        name: "Volume",
        yaxis: "y2",
        marker: {color: "#3fa089"},
    };
    let priceLayout = {
        title: "Stock price",
        xaxis: {
            title: "Date",
            type: "date",
        },
        yaxis1: {
            title: "Price",
            side: "left",
            showline: false,
        },
        yaxis2: {
            title: "Volume",
            side: "right",
            overlaying: "y",
            range: [0, Math.max(...volumes)*1.5],
            showline: false,
            showgrid: false,
        }
    };
    const nowDay = new Date().getUTCDay();
    const nowHours = new Date().getUTCHours();
    const nowMinutes = new Date().getUTCMinutes();
    if (frequency === "1d" && nowDay >=1 && nowDay <= 5 && (nowHours > 14 && nowHours < 20) || (nowHours === 13 && nowMinutes > 30 && nowMinutes <= 59)) {
        const today = new Date();
        const period1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30);
        const period2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16);
        priceLayout.xaxis.range = [period1, period2];
    }
    const chartData = [priceTrace1, priceTrace2];
    Plotly.newPlot("priceChart", chartData, priceLayout);
}

async function checkLogin(token) {
    if (token === null) {
        await Swal.fire({
            title: "Please login first!",
            icon: 'warning',
            showConfirmButton: false,
            timer: "800",
        })
        localStorage.setItem("page", window.location.href);
        window.location = "/login.html";
    } else {
        getElement("#loginBtn").innerText = "Logout";
        getElement("#loginBtn").addEventListener("click", () => {
            localStorage.clear();
            window.location = "/index.html";
            getElement("#loginBtn").innerText = "Login";
        });
    }
}

function showLoginBtn(token) {
    if (token === null) {
        getElement("#loginBtn").addEventListener("click", () => {
            localStorage.setItem("page", window.location.href);
            window.location = "/login.html";    
        });
    } else {
        getElement("#loginBtn").innerText = "Logout";
        getElement("#loginBtn").addEventListener("click", () => {
            localStorage.clear();
            window.location = "/index.html";
            getElement("#loginBtn").innerText = "Login";
        });
    }
}

function autocomplete(inp, arr) {
    let currentFocus;
    inp.addEventListener("input", function(e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
            if (arr[i].toUpperCase().indexOf(val.toUpperCase())!== -1) {
                const index = arr[i].toUpperCase().indexOf(val.toUpperCase());
                b = document.createElement("DIV");
                if (index !== 0) {
                    b.innerHTML += arr[i].substr(0, index);
                }
                b.innerHTML += "<strong>" + arr[i].substr(index, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(index+val.length, arr[i].length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

let symbols;
async function getSymbols() {
    const res = (await fetch(`/api/1.0/stock/symbolList`));
    const resJson = (await res.json()).data;
    const symbolList = resJson.map(i => `${i.symbol} (${i.name})`);
    symbols = resJson.map(i => i.symbol);
    autocomplete(getElement("#symbol_search"), symbolList);
    return resJson;
}

async function getInputSymbols() {
    const res = (await fetch(`/api/1.0/stock/symbolList`));
    const resJson = (await res.json()).data;
    const symbolList = resJson.map(i => `${i.symbol} (${i.name})`);
    autocomplete(getElement("#input_symbol_search"), symbolList);
}


function searchSymbol() {
    const searchBtn = getElement("#searchBtn");
    searchBtn.addEventListener("click", function () {
        const symbol = getElement("#symbol_search").value.split(" ")[0];
        const frequency = getElement("#frequency").value;
        if (symbols.includes(symbol)) {
            localStorage.setItem("symbol", symbol);
            localStorage.setItem("frequency", frequency);
            window.location = "/";
        } else {
            Swal.fire({
                title: "Error",
                text: "Please confirm you entered the right symbol",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        }
    })
}

export {
    getElement,
    getDataByClass,
    createInput,
    createSelect,
    createTitle,
    createList,
    createListWithLink,
    createForm,
    createButton,
    removeItem,
    removeChild,
    createChart,
    checkLogin,
    showLoginBtn,
    getSymbols,
    getInputSymbols,
    searchSymbol
};