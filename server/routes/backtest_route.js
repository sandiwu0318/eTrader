const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getData,
    getResult,
    
} = require("../controllers/backtest_controller");

router.route("/backtest/getData")
    .post(wrapAsync(getData));

router.route("/backtest/getResult")
    .post(wrapAsync(getResult));


module.exports = router;