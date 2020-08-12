require("dotenv").config();
const {PORT, API_VERSION, NODE_ENV, PORT_TEST} = process.env;
const CronJob = require("cron").CronJob;
const {getDailyPrices, getDailyNews, getDailyBasicInfo} = require("./server/controllers/stock_controller");
const {matchPriceOrders, matchIndicatorOrders} = require("./server/controllers/trade_controller");
const {socket} = require("./server/controllers/socket_controller");

const port = NODE_ENV == "test" ? PORT_TEST : PORT;

// Express Initialization
const express = require("express");
const bodyparser = require("body-parser");
const app = express();

app.set("json spaces", 2);

app.use(express.static("public"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

//Server and socket connection
let io;
const server = app.listen(port, () => {console.log(`Listening on port: ${port}`);});
io = require("socket.io")(server);
socket(io);

// API routes
app.use("/api/" + API_VERSION,
    [
        require("./server/routes/stock_route"),
        require("./server/routes/trade_route"),
        require("./server/routes/user_route"),
        require("./server/routes/backtest_route"),
    ]
);

// Error handling
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send("Internal Server Error");
    next();
});

//404 Error page
app.get("*", function(req, res){
    if (req.accepts("html")) {
        res.status(400).send("<script>location.href = \"/not_found.html\";</script>");
        return;
    }
});

// Function to match orders every minute
//9:30-10:00
const Job1 = new CronJob("0 30-59/1 9 * * 1-5", function() {
    matchPriceOrders();
    // matchIndicatorOrders();
},
null,
true,
"America/New_York"
);
Job1.start();

//10:00-16:00
const Job2 = new CronJob("0 */1 10-16 * * 1-5", function() {
    matchPriceOrders();
    matchIndicatorOrders();
},
null,
true,
"America/New_York"
);
Job2.start();

// Function to get stock data every day
const Job3 = new CronJob("00 00 00 * * 2-6", function() {
    getDailyPrices();
    getDailyNews();
    getDailyBasicInfo();
},
null,
true,
"Asia/Taipei"
);
Job3.start();


module.exports = app;
