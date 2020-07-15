const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getData,
    testWithIndicator
    
} = require("../controllers/backtest_controller");

router.route("/backtest/getData")
    .post(wrapAsync(getData));

router.route("/backtest/testWithIndicator")
    .post(wrapAsync(testWithIndicator));


module.exports = router;