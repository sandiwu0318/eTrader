const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getData,
    testWithIndicator,
    testByUserCode
    
} = require("../controllers/backtest_controller");

router.route("/backtest/getData")
    .post(wrapAsync(getData));

router.route("/backtest/testWithIndicator")
    .post(wrapAsync(testWithIndicator));

router.route("/backtest/testByUserCode")
    .post(wrapAsync(testByUserCode));


module.exports = router;