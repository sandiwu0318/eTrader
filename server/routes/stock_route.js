const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getPrices,
    getBasicInfo,
    getNews,
    getApiPrices,
    getApiBasicInfo,
    getApiNews,
    getSymbolList,
    getDailyBasicInfo
} = require("../controllers/stock_controller");


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

router.route("/stock/getSymbolList")
    .get(wrapAsync(getSymbolList));

router.route("/stock/getDailyBasicInfo")
    .get(wrapAsync(getDailyBasicInfo));


module.exports = router;