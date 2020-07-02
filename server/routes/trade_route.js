const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    setOrder,
    
} = require("../controllers/trade_controller");

router.route("/trade/setOrder")
    .post(wrapAsync(setOrder));


module.exports = router;