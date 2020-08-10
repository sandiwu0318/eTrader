const {expect, requester} = require("./setup");
const {users} = require("./test_data");
const {orders} = require("./test_data");

describe("user", () => {
    it("successful signUp", async () => {
        const newUserData = {
            name: "test4",
            email: "test4@gmail.com", 
            password: "test4password"
        };
        const res = await requester
            .post("/api/1.0/user/signUp")
            .send(newUserData);
        const data = res.body.data;
        const expectUser = {
            user: {
                id: data.user.id,
                name: newUserData.name,
                email: newUserData.email
            },
            accessToken: data.accessToken,
            loginAt: data.loginAt
        };
        expect(data).to.deep.equal(expectUser);
    });

    it("signUp failed - Email existed", async () => {
        const userData = {
            name: "test1",
            email: "test1@gmail.com", 
            password: "testForSameEmail"
        };
        const res = await requester
            .post("/api/1.0/user/signUp")
            .send(userData);
        const data = res.body.data;
        expect(data.error).to.deep.equal("Email Already Exists");
    });

    it("successful signIn", async () => {
        const {users} = require("./test_data");
        const res = await requester
            .post("/api/1.0/user/signIn")
            .send(users[0]);
        const data = res.body.data;
        const expectUser = {
            user: {
                id: data.user.id,
                email: users[0].email,
                name: users[0].name,
                watchlist: data.user.watchlist
            },
            accessToken: data.accessToken,
            loginAt: data.loginAt
        };
        expect(data).to.deep.equal(expectUser);
    });

    it("signIn failed - Account not exists", async () => {
        const newUserData = {
            name: "test5",
            email: "test5@gmail.com", 
            password: "test5password"
        };
        const res = await requester
            .post("/api/1.0/user/signIn")
            .send(newUserData);
        const data = res.body.data;
        expect(data.error).to.deep.equal("Please sign up first");
    });

    it("signIn failed - Wrong password", async () => {
        const userData = {
            name: "test1",
            email: "test1@gmail.com", 
            password: "wrongPassword"
        };
        const res = await requester
            .post("/api/1.0/user/signIn")
            .send(userData);
        const data = res.body.data;
        expect(data.error).to.deep.equal("Password is wrong");
    });

    it("addToWatchlist - has current watchlist", async () => {
        const watchlistData = {
            symbol: "AAPL"
        };
        const res = await requester
            .post("/api/1.0/user/addToWatchlist")
            .send(watchlistData)
            .set("Authorization", "test1accesstoken");
        const data = res.body.data;
        const expectWatchlist = users[0].watchlist.split(",");
        expectWatchlist.push(watchlistData.symbol);
        expect(data.watchlist).to.deep.equal(expectWatchlist);
    });

    it("Add to watchlist - no current watchlist", async () => {
        const watchlistData = {
            symbol: "AAPL"
        };
        const res = await requester
            .post("/api/1.0/user/addToWatchlist")
            .send(watchlistData)
            .set("Authorization", "test2accesstoken");
        const data = res.body.data;
        const expectWatchlist = watchlistData.symbol.split(",");
        expect(data.watchlist).to.deep.equal(expectWatchlist);
    });

    it("Remove from watchlist", async () => {
        const watchlistData = {
            symbol: "AAPL"
        };
        const res = await requester
            .post("/api/1.0/user/removeFromWatchlist")
            .send(watchlistData)
            .set("Authorization", "test1accesstoken");
        const data = res.body.data;
        const expectWatchlist = users[0].watchlist.split(",");
        expect(data.watchlist).to.deep.equal(expectWatchlist);
    });

    it("Get watchlist", async () => {
        const watchlistData = {
            symbolOnly: 1
        };
        const res = await requester
            .post("/api/1.0/user/getWatchlist")
            .send(watchlistData)
            .set("Authorization", "test1accesstoken");
        const data = res.body.data;
        const expectWatchlist = users[0].watchlist;
        expect(data[0].watchlist).to.deep.equal(expectWatchlist);
    });

    it("Get watchlist", async () => {
        const watchlistData = {
            symbolOnly: 1
        };
        const res = await requester
            .post("/api/1.0/user/getWatchlist")
            .send(watchlistData)
            .set("Authorization", "test3accesstoken");
        const data = res.body.data;
        expect(data.error).to.deep.equal("You don't have any watchlist yet");
    });

});