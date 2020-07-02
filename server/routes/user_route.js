const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    addRemoveWatchlist,
    getWatchlist,
    getOrders
} = require("../controllers/user_controller");

router.route("/user/addRemoveWatchlist")
    .post(wrapAsync(addRemoveWatchlist));

router.route("/user/getWatchlist")
    .post(wrapAsync(getWatchlist));

router.route("/user/getOrders")
    .post(wrapAsync(getOrders));

module.exports = router;