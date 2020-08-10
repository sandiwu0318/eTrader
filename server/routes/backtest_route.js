const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    showIndicatorData,
    testWithIndicator,
    saveBacktestResult,
    getSavedResults
    
} = require("../controllers/backtest_controller");

router.route("/backtest/showIndicatorData")
    .post(wrapAsync(showIndicatorData));

router.route("/backtest/testWithIndicator")
    .post(wrapAsync(testWithIndicator));

router.route("/backtest/saveBacktestResult")
    .post(wrapAsync(saveBacktestResult));

router.route("/backtest/getSavedResults")
    .get(wrapAsync(getSavedResults));


module.exports = router;