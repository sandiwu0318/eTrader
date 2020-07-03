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

export {
    getElement,
    createList,
    createListWithLink,
    createForm,
};