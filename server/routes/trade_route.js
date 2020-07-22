const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    setOrder,
    matchPriceOrders,
    matchIndicatorOrders
    
} = require("../controllers/trade_controller");

router.route("/trade/setOrder")
    .post(wrapAsync(setOrder));


router.route("/trade/matchPriceOrders")
    .get(wrapAsync(matchPriceOrders));

router.route("/trade/matchIndicatorOrders")
    .get(wrapAsync(matchIndicatorOrders));


module.exports = router;