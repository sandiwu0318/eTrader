const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    setOrder,
    matchPriceOrders,
    matchIndicatorOrders,
    deleteOrder
    
} = require("../controllers/trade_controller");

router.route("/trade/setOrder")
    .post(wrapAsync(setOrder));


router.route("/trade/matchPriceOrders")
    .get(wrapAsync(matchPriceOrders));

router.route("/trade/matchIndicatorOrders")
    .get(wrapAsync(matchIndicatorOrders));

router.route("/trade/deleteOrder")
    .post(wrapAsync(deleteOrder));


module.exports = router;