-- MySQL dump 10.13  Distrib 5.7.30, for macos10.14 (x86_64)
--
-- Host: localhost    Database: etrader
-- ------------------------------------------------------
-- Server version	5.7.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `backtest_result`
--

DROP TABLE IF EXISTS `backtest_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backtest_result` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `periods` varchar(45) DEFAULT NULL,
  `symbol` varchar(45) DEFAULT NULL,
  `action` varchar(45) DEFAULT NULL,
  `volume` int(11) DEFAULT NULL,
  `indicator` varchar(45) DEFAULT NULL,
  `indicatorPeriod` int(11) DEFAULT NULL,
  `actionValue` varchar(45) DEFAULT NULL,
  `actionCross` varchar(45) DEFAULT NULL,
  `exitValue` varchar(45) DEFAULT NULL,
  `exitCross` varchar(45) DEFAULT NULL,
  `investmentReturn` int(11) DEFAULT NULL,
  `ROI` float DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_idx` (`user_id`),
  CONSTRAINT `id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(20) DEFAULT NULL,
  `symbol` varchar(20) DEFAULT NULL,
  `volume` int(20) DEFAULT NULL,
  `action` varchar(45) DEFAULT NULL,
  `sub_action` varchar(45) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  `price` float DEFAULT NULL,
  `RSI` int(11) DEFAULT NULL,
  `BB` varchar(45) DEFAULT NULL,
  `MA` varchar(45) DEFAULT NULL,
  `indicatorPeriod` int(11) DEFAULT NULL,
  `cross` varchar(45) DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `success` int(11) DEFAULT NULL,
  `success_date` datetime DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_basicInfo`
--

DROP TABLE IF EXISTS `stock_basicInfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_basicInfo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(45) DEFAULT NULL,
  `prevClose` float DEFAULT NULL,
  `dayRange` varchar(45) DEFAULT NULL,
  `averageVolume` float DEFAULT NULL,
  `annualReturn` float DEFAULT NULL,
  `beta` float DEFAULT NULL,
  `marketCap` float DEFAULT NULL,
  `eps` float DEFAULT NULL,
  `peRation` float DEFAULT NULL,
  `dividend` float DEFAULT NULL,
  `financialChart` varchar(10000) DEFAULT NULL,
  `profile` varchar(10000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_news`
--

DROP TABLE IF EXISTS `stock_news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(45) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1179 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_price`
--

DROP TABLE IF EXISTS `stock_price`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_price` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(45) DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `price` float DEFAULT NULL,
  `volume` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=126084 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_symbol`
--

DROP TABLE IF EXISTS `stock_symbol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_symbol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `symbol` varchar(45) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Symbol_UNIQUE` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=30494 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider` varchar(255) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `access_token` varchar(255) DEFAULT NULL,
  `access_expired` int(11) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `watchlist` varchar(800) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-08-01 16:39:44
