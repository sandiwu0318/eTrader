const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getIntradayPrices,
    getPrices,
    getBasicInfo,
    getNews,
    getApiPrices,
    getApiBasicInfo,
    getApiNews,
    symbolList,
    dailyGetPrices,
    dailyGetNews
} = require("../controllers/stock_controller");

router.route("/stock/getIntradayPrices")
    .get(wrapAsync(getIntradayPrices));

router.route("/stock/getPrices")
    .get(wrapAsync(getPrices));

router.route("/stock/getBasicInfo")
    .get(wrapAsync(getBasicInfo));

router.route("/stock/getNews")
    .get(wrapAsync(getNews));

router.route("/stock/getApiPrices")
    .get(wrapAsync(getApiPrices));

router.route("/stock/getApiBasicInfo")
    .get(wrapAsync(getApiBasicInfo));

router.route("/stock/getApiNews")
    .get(wrapAsync(getApiNews));

router.route("/stock/symbolList")
    .get(wrapAsync(symbolList));

router.route("/stock/dailyGetPrices")
    .get(wrapAsync(dailyGetPrices));

router.route("/stock/dailyGetNews")
    .get(wrapAsync(dailyGetNews));

module.exports = router;