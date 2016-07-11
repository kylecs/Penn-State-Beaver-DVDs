module.exports = function(logger, express){
  var mod = {};
  var router = express.Router();

  //login, save login status and authorization level in session
  router.post("/login", function(req, res){
    var username = req.body.username;
    var password = req.body.password;

    var session = req.session;
    if(username == "admin" && password == process.env.ADMIN_PASSWORD){
      logger.info("Admin Login");
      session.access = "admin"
      session.loggedin = true;
    }else if(username == "god" && password == process.env.GOD_PASSWORD){
      logger.warn("God Login");
      session.access = "god"
      session.loggedin = true;
    }else{
      session.loggedin = false;
    }
    res.redirect("/auth/authstatus");
  });//asdf

  //Removes access tag and sets logged in status to false.
  router.get("/logout", function(req, res){
    req.session.loggedin = false;
    req.session.access = "";
    res.redirect("/auth/authstatus");
  });

  //Get session info
  router.get("/authstatus", function(req, res){
    res.send({loggedin: req.session.loggedin, access: req.session.access});
  });

  //Middleware to restrict path to admins
  mod.requireLogin = function(req, res, next){
    if(req.session.loggedin){
      next();
    }else{
      logger.info("Admin Access Attempt Averted"); //alliteration
      res.send({error: "Admin level access required!"});
    }
  }

  //Require godmode to use
  //NODE: godmode is not currently implemented
  mod.requireGodmode = function(req, res, next){
    if(req.session.loggedin && req.session.access == "god"){
      next();
    }else{
      logger.info("Godmode Access Attempt Averted");
      res.send({error: "Godmode level access required!"});
    }
  }

  mod.router = router;
  return mod;
}
