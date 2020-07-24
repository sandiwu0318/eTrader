const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    signUp,
    nativeSignIn,
    addRemoveWatchlist,
    getWatchlist,
    getOrders,
    getPortfolios
} = require("../controllers/user_controller");

router.route("/user/signUp")
    .post(wrapAsync(signUp));

router.route("/user/nativeSignIn")
    .post(wrapAsync(nativeSignIn));

router.route("/user/addRemoveWatchlist")
    .post(wrapAsync(addRemoveWatchlist));

router.route("/user/getWatchlist")
    .post(wrapAsync(getWatchlist));

router.route("/user/getOrders")
    .post(wrapAsync(getOrders));

router.route("/user/getPortfolios")
    .post(wrapAsync(getPortfolios));

module.exports = router;