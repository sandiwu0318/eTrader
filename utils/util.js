require("dotenv").config();

// reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
const wrapAsync = (fn) => {
    return function(req, res, next) {
        // Make sure to `.catch()` any errors and pass them along to the `next()`
        // middleware in the chain, in this case the error handler.
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


module.exports = {
    wrapAsync,
    toThousands
};
