const app = require("../app");
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const requester = chai.request(app).keepOpen();
const {expect} = chai;
const {NODE_ENV} = process.env;
const {truncateTestData, createTestData} = require("./test_data_generator");


before(async () => {
    if (NODE_ENV !== "test") {
        throw "Not in test env";
    }
    await truncateTestData();
    await createTestData();
});


module.exports = {
    expect,
    requester
};