const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    getData,
    
} = require("../controllers/backtest_controller");

router.route("/backtest/getData")
    .post(wrapAsync(getData));

// router.route("/backtest/getBasicInfo")
//     .get(wrapAsync(getBasicInfo));


module.exports = router;