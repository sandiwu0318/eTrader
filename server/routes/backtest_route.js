const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getData,
    testWithPrices,
    testWithRSI
    
} = require("../controllers/backtest_controller");

router.route("/backtest/getData")
    .post(wrapAsync(getData));

router.route("/backtest/testWithPrices")
    .post(wrapAsync(testWithPrices));

router.route("/backtest/testWithRSI")
    .post(wrapAsync(testWithRSI));


module.exports = router;