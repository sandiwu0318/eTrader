const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getData,
    testWithIndicator,
    saveBacktestResult,
    getSavedResults
    
} = require("../controllers/backtest_controller");

router.route("/backtest/getData")
    .post(wrapAsync(getData));

router.route("/backtest/testWithIndicator")
    .post(wrapAsync(testWithIndicator));

router.route("/backtest/saveBacktestResult")
    .post(wrapAsync(saveBacktestResult));

router.route("/backtest/getSavedResults")
    .post(wrapAsync(getSavedResults));


module.exports = router;