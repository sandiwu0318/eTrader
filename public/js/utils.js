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
    form.id = formId;
    inputArr.map(i => {
        const input = document.createElement("input");
        input.id = i;
        input.className = "input";
        input.placeholder = i;
        form.appendChild(input);
    })
    const btn = document.createElement("button");
    btn.id = button;
    btn.className = "btn";
    btn.type = "button";
    btn.innerText = button;
    form.appendChild(btn);
    const div = getElement("#trade");
    div.appendChild(form);
    
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

function checkLogin(token) {
    if (token === null) {
        alert("Please login first!");
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
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
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
    showLoginBtn,
    autocomplete
};