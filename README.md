# eTrader
#### a US stock trading and backtesting simulation platform.
* Search and track your favorite stocks.
* Backtest with different indicators (ex. RSI, SMA, BB line).
* Place orders in real-time with prices or indicators.
> Website URL: https://etrader.fun
> 
> Direct login with demo account: https://etrader.fun/login.html?demo

---

## Table of Contents
* [Technologies](#Technologies)
* [Architecture](#Architecture)
* [Database schema](#Database-schema)
* [Main features](#Main-features)
* [Demo accounts](#Demo-accounts)

## Technologies
### Backend
* Node.js / Express.js
* RESTful API
* NGINX
* socket.io
### Front-End
* HTML
* CSS
* JavaScript
### Cloud Service (AWS)
* EC2
### Database
* MySQL
### Networking
* HTTPS
* SSL
* Domain Name System (DNS)
### Tools
* Version Control: Git, GitHub
* Test: Mocha, Chai
* Agile: Trello (Scrum)
### Others
* Design Pattern: MVC

## Architecture

![](https://i.imgur.com/TrAs2Yv.jpg)

## Database schema

![](https://i.imgur.com/oYBouiY.png)

## Main features
* Stock search
    * Search for real-time and historical stock prices
    * Applied socket.io to display real-time stock prices

![](https://i.imgur.com/ogfYLT1.gif)


* Login
    * Login to have full features
        * Add to watchlist
        * Place orders
        * Save backtesting results

![](https://i.imgur.com/2Uw7ojL.gif)


* Place orders
    * Place orders on your favorite stock
    * The orders will be shown in Pending Orders page
    * Use CronJob to match placed orders during market time

![](https://i.imgur.com/CldtwXx.gif)



* Backtest
    * Backtest with different indicators
        * Price
        * RSI
        * BB line
        * SMA
        * WMA
        * EMA
    * Save backtesting results for future use
    * Place orders with these indicators

![](https://i.imgur.com/uw1UmeH.gif)


## Demo accounts
* Account: demo1@demo.com
* Password: etraderdemo1
