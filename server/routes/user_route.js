const router = require("express").Router();
const {wrapAsync} = require("../../utils/util");

const {
    signUp,
    signIn,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
    getOrders,
    getPortfolios
} = require("../controllers/user_controller");

router.route("/user/signUp")
    .post(wrapAsync(signUp));

router.route("/user/signIn")
    .post(wrapAsync(signIn));

router.route("/user/addToWatchlist")
    .post(wrapAsync(addToWatchlist));

router.route("/user/removeFromWatchlist")
    .post(wrapAsync(removeFromWatchlist));

router.route("/user/getWatchlist")
    .post(wrapAsync(getWatchlist));

router.route("/user/getOrders")
    .post(wrapAsync(getOrders));

router.route("/user/getPortfolios")
    .post(wrapAsync(getPortfolios));

module.exports = router;