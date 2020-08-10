const {closeConnection} = require("./test_data_generator");
const {requester} = require("./setup");

after(async () => {
    await closeConnection();
    requester.close();
});