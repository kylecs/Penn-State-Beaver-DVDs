#!/bin/env node

var fs = require("fs");
var express = require("express");
var request = require("request");
var Sequelize = require("sequelize");
var bodyParser = require("body-parser");
var NodeCache = require("node-cache");
var session = require("express-session");
var database = require("./database/database")(Sequelize);
var winston = require("winston");

//this will create some globals for the program, used to quickly change arbitrary behavior, like cache TTLs
require("./globals")();

//setup custom logger
var logger = createLogger();
//configure cache, cache TTL is always given on item creations, so no default will be specified.
var cache = new NodeCache({
  checkperiod: global.CacheCheckPeriod
});

//create routes, to be added in MoviesApp.initialize()
var auth = require("./routes/auth")(logger, express);
var api = require("./routes/api")(logger, express, request, database, cache, auth, fs);

//this handles cache expiration / regeneration
var cacheUtils = require("./cache/cacheUtil")(logger, cache, database);

//sets up a winston logger on console and file
function createLogger() {
  //find directory on openshift or locally
  var logDir = "";
  if(process.env.OPENSHIFT_DATA_DIR){
    logDir += process.env.OPENSHIFT_DATA_DIR + "winston-logs/";
  } else {
    logDir += "./logs/";
  }
  console.log("Attempting to use winston log directory: " + logDir);

  var logFile = logDir + "winston.log";

  //create log file if it doesn't exist
  try{
    fs.writeFileSync(logFile, "", { flag: "wx" });
  }catch(err) {}

  //log debug level locally, but info level on production
  var logLevel = "";
  if(global.Production){
    logLevel = "info";
  }else {
    logLevel = "debug";
  }
  console.log("Useing logging level: " + logLevel);
  return new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ level: logLevel }),
      new (winston.transports.File)({ filename: logFile, json: false, level: logLevel }),
    ]
  });
}

var MoviesApp = function() {
    var self = this;

    //Get port and ip from openshift environment
    self.setupVariables = function() {
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            logger.warn("No OPENSHIFT_NODEJS_IP var, using 127.0.0.1");
            self.ipaddress = "127.0.0.1";
        };
    };

    //Setup termination request handlers
    self.setupTerminationHandlers = function(){
        process.on("exit", function() { self.terminator(); });

        ["SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT",
         "SIGBUS", "SIGFPE", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGTERM"
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    //Terminate process upon requests
    self.terminator = function(sig){
        if (typeof sig === "string") {
           logger.info("Process Received %s - Terminating...", sig);
           process.exit(1);
        }
        logger.info("%s: Node server stopped.", Date(Date.now()));
    };

    //Setup express
    self.initialize = function() {
        logger.info("Initializing Server");
        self.setupVariables();
        self.setupTerminationHandlers();

        self.app = express();

        //setup middleware
        self.app.use(bodyParser.json());
        self.app.use(bodyParser.urlencoded({
          extended: true
        }));

        self.app.use(session({
          secret: process.env.SECRET_KEY || "demo_key",
          resave: false,
          saveUninitialized: false
        }));

        //setup routes
        self.app.set("view engine", "pug");
        self.app.use("/public", express.static("dist"));
        self.app.use("/images", express.static(global.ImageDir));
        self.app.use("/api/", api.router);
        self.app.use("/auth/", auth.router);
        self.app.get("/", function(req, res){
          res.render("index.pug")
        });
        self.app.get("/login", function(req, res){
          res.render("login.pug")
        });
        logger.info("Server Initialized");
    };

    //Start server
    self.start = function() {
        logger.info("Starting Server");
        self.app.listen(self.port, self.ipaddress, function() {
            logger.info("Server started on %s:%s", self.ipaddress, self.port);
        });
    };
};

var app = new MoviesApp();
app.initialize();
app.start();
