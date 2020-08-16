require("dotenv").config();

// reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
// Error handler.
const wrapAsync = (fn) => {
    return function(req, res, next) {
        fn(req, res, next).catch(next);
    };
};

const toThousands = function (num) {
    let number = (num || 0).toString();
    let result = "";
    while (number.length > 3) {
        result = "," + number.slice(-3) + result;
        number = number.slice(0, number.length - 3);
    }
    if (number) { result = number + result; }
    return result;
};

const getData = function(data, category, name) {
    if (data[category]) {
        return data[category][name] || {};
    }
    return {};
};

const isMA = function(indicator) {
    return indicator.substr(1, 2) === "MA";
};

const formatedDate = function(date) {
    return date.substr(0, 10);
};



module.exports = {
    wrapAsync,
    toThousands,
    getData,
    isMA,
    formatedDate
};
