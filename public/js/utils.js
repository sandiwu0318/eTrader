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

function createTitle(id, title) {
    const element = getElement(id);
    const h2 = document.createElement("h2")
    h2.innerText = title;
    element.appendChild(h2);
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
    // if (frequency === "1d") {
    //     priceLayout.xaxis.rangebreaks[0].pattern = "hour";
    //     priceLayout.xaxis.rangebreaks[0].bounds = [16.1, 9.58];
    // }
    const chartData = [priceTrace1, priceTrace2];
    Plotly.newPlot("priceChart", chartData, priceLayout);
}

export {
    getElement,
    getDataByClass,
    createTitle,
    createList,
    createListWithLink,
    createForm,
    removeItem,
    removeChild,
    createChart
};