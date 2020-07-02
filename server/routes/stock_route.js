const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getStockPrice,
    getBasicInfo,
    symbolSearch
} = require("../controllers/stock_controller");

router.route("/stock/getStockPrice")
    .get(wrapAsync(getStockPrice));

router.route("/stock/getBasicInfo")
    .get(wrapAsync(getBasicInfo));

router.route("/stock/symbolSearch")
    .get(wrapAsync(symbolSearch));

module.exports = router;