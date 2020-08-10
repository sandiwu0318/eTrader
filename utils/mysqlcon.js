require("dotenv").config();
const mysql = require("mysql");
const env = process.env.NODE_ENV;
const multipleStatements = (process.env.NODE_ENV === "test");
const {promisify} = require("util"); // util from native nodejs library
const {HOST, USERNAME, PASSWORD, DATABASE, TEST_DATABASE} = process.env;

const mysqlConfig = {
    production: {
        host: HOST,
        user: USERNAME,
        password: PASSWORD,
        database: DATABASE
    },
    development: {
        host: HOST,
        user: USERNAME,
        password: PASSWORD,
        database: DATABASE
    },
    test: {
        host: HOST,
        user: USERNAME,
        password: PASSWORD,
        database: TEST_DATABASE
    }
};

const mysqlCon = mysql.createConnection(mysqlConfig[env], {multipleStatements});

const promiseQuery = (query, bindings) => {
    return promisify(mysqlCon.query).bind(mysqlCon)(query, bindings);
};

const promiseTransaction = promisify(mysqlCon.beginTransaction).bind(mysqlCon);
const promiseCommit = promisify(mysqlCon.commit).bind(mysqlCon);
const promiseRollback = promisify(mysqlCon.rollback).bind(mysqlCon);
const promiseEnd = promisify(mysqlCon.end).bind(mysqlCon);

module.exports={
    core: mysql,
    query: promiseQuery,
    transaction: promiseTransaction,
    commit: promiseCommit,
    rollback: promiseRollback,
    end: promiseEnd,
};