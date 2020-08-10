const {expect, requester} = require("./setup");
const {backtestResults} = require("./test_data");

describe("backtest", () => {
    it("showIndicatorData", async () => {
        const indicatorData = {
            periods: ["2020-07-08", "2020-07-15"],
            symbol: "AMZN",
            indicator: "RSI",
            indicatorPeriod: 6
        };
        const res = await requester
            .post("/api/1.0/backtest/showIndicatorData")
            .send(indicatorData);
        const data = res.body.data;
        const {expectedIndicatorData} = require("./test_data");
        expect(data).to.deep.equal(expectedIndicatorData);
    });

    it("testWithIndicator", async () => {
        const backtestData = {
            "periods": ["2020-06-25", "2020-07-25"],
            "symbol": "AMZN",
            "action": "long",
            "volume": 100,
            "indicator":"SMA",
            "actionValue": 14,
            "actionCross": "crossup",
            "exitValue": 6,
            "exitCross": "crossup"
        };
        const res = await requester
            .post("/api/1.0/backtest/testWithIndicator")
            .send(backtestData);
        const data = res.body.data;
        const {expectedBacktestData} = require("./test_data");
        expect(data).to.deep.equal(expectedBacktestData);
    });


    it("saveBacktestResult", async () => {
        const backtestData = {
            periods: ["2020-01-01", "2020-07-01"],
            symbol: "TSLA",
            volume: 30,
            action: "long",
            indicator: "RSI",
            indicatorPeriod: 6,
            actionValue: 20,
            actionCross: "crossup",
            exitValue: 80,
            exitCross: "crossup",
            investmentReturn: 215,
            ROI: 0.109993,
            created_date: "2020-08-01"
        };
        const res = await requester
            .post("/api/1.0/backtest/saveBacktestResult")
            .send(backtestData)
            .set("Authorization", "test1accesstoken");
        const data = res.body.data;
        backtestData.user_id = data.user_id;
        backtestResults[0].periods = JSON.parse(backtestResults[0].periods);
        backtestResults[0].created_date = data.created_date;
        backtestResults.push(data);
        expect(data).to.deep.equal(backtestResults[0]);
    });

    it("getSavedResults", async () => {
        const res = await requester
            .get("/api/1.0/backtest/getSavedResults")
            .set("Authorization", "test1accesstoken");
        const data = res.body.data;
        for (let i =0; i<data.length; i++) {
            backtestResults[i].created_date = data[i].created_date;
            backtestResults[i].id = data[i].id;
        }
        for (let i of data) {
            if (i.indicator === "RSI") {
                i.actionValue = parseInt(i.actionValue);
                i.exitValue = parseInt(i.exitValue);
            }
        }
        backtestResults[1].periods = JSON.parse(backtestResults[1].periods);
        expect(data).to.deep.equal(backtestResults);
    });
});