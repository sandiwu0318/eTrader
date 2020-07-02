require("dotenv").config();
const {PORT_TEST, PORT, NODE_ENV, API_VERSION} = process.env;
const port = NODE_ENV == "test" ? PORT_TEST : PORT;
const CronJob = require("cron").CronJob;
const {matchOrders} = require("./server/controllers/trade_controller");

// Express Initialization
const express = require("express");
const bodyparser = require("body-parser");
const app = express();

app.set("json spaces", 2);

app.use(express.static("public"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

// CORS Control
app.use("/api/", function(req, res, next){
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.set("Access-Control-Allow-Credentials", "true");
    next();
});

// API routes
app.use("/api/" + API_VERSION,
    [
        require("./server/routes/stock_route"),
        require("./server/routes/trade_route"),
    ]
);

// Error handling
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send("Internal Server Error");
    next();
});

if (NODE_ENV != "production"){
    app.listen(port, () => {console.log(`Listening on port: ${port}`);});
}

// Function to match orders every minute
//9:30-10:00
const Job1 = new CronJob("0 30-59/1 9 * * 1-5", function() {
    matchOrders();
},
null,
true,
"America/New_York"
// "Asia/Taipei"

);
Job1.start;
//10:00-16:00
const Job2 = new CronJob("0 */1 10-16 * * 1-5", function() {
    matchOrders();
},
null,
true,
"America/New_York"
// "Asia/Taipei"
);
Job2.start;


module.exports = app;
