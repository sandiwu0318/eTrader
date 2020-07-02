require("dotenv").config();
const mysql = require("mysql");
const {promisify} = require("util"); // util from native nodejs library
const env = process.env.NODE_ENV || "production";
const {HOST, USERNAME, PASSWORD, DATABASE} = process.env;

const mysqlConfig = {
    production: { // for EC2 machine
        host: HOST,
        user: USERNAME,
        password: PASSWORD,
        database: DATABASE
    },
    development: { // for localhost development
        host: HOST,
        user: USERNAME,
        password: PASSWORD,
        database: DATABASE
    }
};

const mysqlCon = mysql.createConnection(mysqlConfig[env]);

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