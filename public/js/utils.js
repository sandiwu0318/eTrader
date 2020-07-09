function getElement(element) {
    return document.querySelector(element);
}

function getDataByClass(className) {
    const elements = document.getElementsByClassName(className);
    let arr = [];
    for (let i of elements) {
        let value = i.value;
        arr.push(value);
    }
    return arr;
}

function createInput(className) {
    const input = document.createElement("input");
    const inputList = document.getElementsByClassName(className);
    const lastInput = inputList[inputList.length-1];
    const form = getElement("#test_form");
    input.type = "text";
    input.className = `test_input ${className}`;
    form.insertBefore(input, lastInput.nextElementSibling)
}

function createSelect(className, options) {
    const select = document.createElement("select");
    options.forEach(i => {
        const option = document.createElement("option");
        option.value = i;
        option.innerText = i;
        select.appendChild(option);   
    })
    const inputList = document.getElementsByClassName(className);
    const lastInput = inputList[inputList.length-1];
    const form = getElement("#test_form");
    select.className = `test_input ${className}`;
    form.insertBefore(select, lastInput.nextElementSibling)
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

function createForm(formId, inputArr, button) {
    const form = document.createElement("form");
    inputArr.map(i => {
        const input = document.createElement("input");
        input.id = i;
        input.className = "input";
        input.placeholder = i;
        form.appendChild(input);
    })
    const btn = document.createElement("button");
    const div = getElement("#trade");
    form.id = formId;
    btn.id = button;
    btn.className = "btn";
    btn.type = "button";
    btn.innerText = button;
    div.appendChild(form);
    form.appendChild(btn);
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

function createChart(data) {
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
            // rangebreaks: [{
            //     pattern: "day of week",
            //     bounds: ["sat", "mon"]
            // }],
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
            range: [0, Math.max(...volumes)*2],
            showline: false,
            showgrid: false,
        }
    };
    if (frequency === "1d") {
        priceLayout.xaxis.range = []
        // priceLayout.xaxis.rangebreaks[0].pattern = "hour";
        // priceLayout.xaxis.rangebreaks[0].bounds = [16.1, 9.58];
    }
    const chartData = [priceTrace1, priceTrace2];
    Plotly.newPlot("priceChart", chartData, priceLayout);
}

function checkLogin(id) {
    if (id === null) {
        localStorage.setItem("page", window.location.href);
        window.location = "/login.html";
    } else {
            getElement("#loginBtn").innerText = "Logout";
            getElement("#loginBtn").addEventListener("click", () => localStorage.clear());
    }
}

function loginBtn() {
    getElement("#loginBtn").addEventListener("click", () => window.location = "/login.html");
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
    removeItem,
    removeChild,
    createChart,
    checkLogin,
    loginBtn
};