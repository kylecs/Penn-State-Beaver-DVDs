
module.exports = function(logger, express, request, database, cache, auth, fs){
  var mod = {};
  var router = express.Router();

  router.get("/keepalive", function(req, res){
    res.send("Still Alive!");
  });

  //ensure we have image, download if not, callback 'then' is given true
  //if and only if the image exists
  function addImage(imdb_id, origin_url, then) {
    logger.info("Attempting to download image");
    var options = {
            url: origin_url,
            headers: {
              referer: "http://imdb.com/"
            }
        }
    //check if file exists
    fs.stat(global.ImageDir + imdb_id + ".jpg", function(err, stat) {
      if(!err) {
        then(true);
        return;
      }

      //download image
      request(options).pipe(
        fs.createWriteStream(global.ImageDir + imdb_id + ".jpg"))
        .on("close", function(){
                then(true)
              }).on("error", function(err){
                then(false);
              });
    });
  }

  //Add movie to database, and request image server to download image
  router.post("/addmovie", auth.requireLogin, function(req, res){
    logger.info("Add Movie Request: " + req.body.title);
    //Get form data
    var title = req.body.title;
    var imdb_id = req.body.imdb_id;
    var origin_url = req.body.origin_url;
    var categories_str = req.body.categories;
    var rated = req.body.rated;
    var year = req.body.year;
    var imdbVotes = Number(req.body.imdbVotes.replace(/\,/g,""));
    var imdbRating = parseFloat(req.body.imdbRating);
    var type = req.body.type;
    var runtime = Number(req.body.runtime.split(" ")[0]);

    //validate data
    if(isNaN(runtime)){
      runtime = 0;
    }
    if(isNaN(imdbVotes)){
      imdbVotes = 0;
    }
    if(isNaN(imdbRating)){
      imdbRating = 0.0;
    }
    //parse categories
    var categories = []
    try{
      categories = categories_str.split(", ");
    }catch(error){
      res.send({error: "Couldn't parse categories"});
      return
    }
    database.Movie.findOne({where: {
      imdb_id: imdb_id
    }}).then(function(result){
      if(result){
        res.send({error: "DVD Already Exists"});
        return;
      }
      //HERE: The movie does not exists, next we will try to get the picture added
      addImage(imdb_id, origin_url, function(result) {
        if(result){
          logger.info("Image download success");
          //HERE: The picture is successfully added, now we will try to create the movie in the db
          database.Movie.create({
            imdb_id: imdb_id,
            title: title,
            rated: rated,
            year: year,
            imdbVotes: imdbVotes,
            imdbRating: imdbRating,
            type: type,
            runtime: runtime
          }).then(function(movie){
            if(movie.imdb_id != imdb_id){
              res.send({error: "Database Error"})
              logger.error("Database Error, ID's don't match");
              return
            }
            //HERE: movie is added to db, now we add categories
            categories.forEach(function(item, index){
              database.Category.findOne({
                where: {
                  name: item
                }
              }).then(function(category){
                if(category){
                  movie.addCategory(category);
                  logger.debug("Category exists! " + item);
                }else{
                  logger.debug("Creating category! " + item);
                  database.Category.create({
                    name: item
                  }).then(function(category){
                    movie.addCategory(category);
                  })
                }
              })
            });

            //Flush cache so the new movie shows up in all new requests
            logger.info("DVD Added, Flushing cache");
            cache.flushAll();
            res.send({success: "Movie added"})
          });
        }else{
          logger.info("Image download failure");
          res.send({error: "Couldn't download image"});
          return;
        }
      });

    });
  });

  //Check the cache for the page. Query the database if it is not set, then set it
  function queryPageWithCache(databaseTable, queryParams, pageTitle, cacheTTL, success, error){
    cache.get(pageTitle, function(err, value){
      if(err){
        logger.error("CACHE_GET_FAILURE: " + pageTitle);

        error(err);
        return;
      }
      if(value != undefined){
        logger.debug("CACHE_GET_SUCCESS: " + pageTitle);
        success(value);
      }else{
        databaseTable.findAll(queryParams).then(function(items){
          cache.set(pageTitle, JSON.stringify(items), cacheTTL, function(err, success){
              if(err){
                logger.error("CACHE_SET_FAILURE: " + pageTitle);
              }else{
                logger.debug("CACHE_SET_SUCCESS: " + pageTitle);
              }
          });
          success(items);
        });
      }
    });
  }

  //Get movies with the most imdb votes, paginated
  router.get("/popular", function(req, res){
    var pageNumber = Number(req.query.page) - 1 || 0;
    var ttl = 0;
    if(pageNumber == 1){
      ttl = global.FrontPageTTL;
    }else{
      ttl = global.ExtendedPageTTL;
    }
    var pageTitle = "popular_" + pageNumber;
    var queryParams = {
      offset: pageNumber*16,
      limit: 16,
      where: {
        type: "movie"
      },
      order: [
        ["imdbVotes", "DESC"]
      ],
      attributes: ["imdb_id", "title", "type"]
    }
    queryPageWithCache(database.Movie, queryParams, pageTitle, ttl, function(items){
      res.send(items);
      }, function(error){
      res.send({"error" : JSON.stringify(error)});
    });
  });

  //Get tv shows, sorted by imdb_id votes, paginated
  router.get("/tv", function(req, res){
    var pageNumber = Number(req.query.page) - 1 || 0;
    var ttl = 0;
    if(pageNumber == 1){
      ttl = global.FrontPageTTL;
    }else{
      ttl = global.ExtendedPageTTL;
    }
    var pageTitle = "tv_" + pageNumber;
    var queryParams = {
      offset: pageNumber*16,
      limit: 16,
      where: {
        type: "series"
      },
      order: [
        ["imdbVotes", "DESC"]
      ],
      attributes: ["imdb_id", "title", "type"]
    }
    queryPageWithCache(database.Movie, queryParams, pageTitle, ttl, function(items){
      res.send(items);
      }, function(error){
      res.send({"error" : JSON.stringify(error)});
    });
  });

  //Get movies sorted by release year descending, paginated
  router.get("/new", function(req, res){
    var pageNumber = Number(req.query.page) - 1 || 0;
    var ttl = 0;
    if(pageNumber == 1){
      ttl = global.FrontPageTTL;
    }else{
      ttl = global.ExtendedPageTTL;
    }
    var pageTitle = "new_" + pageNumber;

    cache.get(pageTitle, function(err, value){
      if(err){
        logger.error("CACHE_GET_FAILURE: " + pageTitle);
        error(err);
        return;
      }
      if(value != undefined){
        logger.debug("CACHE_GET_SUCCESS: " + pageTitle);
        res.send(value)
      }else{
        //basically magic, parses year from year string, casts to int, and orders
        database.sequelize.query("SELECT imdb_id, title, type FROM movies WHERE type = 'movie' ORDER BY NULLIF(regexp_replace(year, E'\\D', '', 'g'), '')::int DESC, \"createdAt\" DESC LIMIT 16 OFFSET " + pageNumber * 16,
          {model: database.Movie}
        ).then(function(items){
          cache.set(pageTitle, JSON.stringify(items), ttl, function(err, success){
              if(err){
                logger.error("CACHE_SET_FAILURE: " + pageTitle);
              }else{
                logger.debug("CACHE_SET_SUCCESS: " + pageTitle);
              }
          });
          res.send(items);
        });
      }
    });
  });

  //get the top rated movies, sorted by imdbRating DESC
  router.get("/top", function(req, res){
    var pageNumber = Number(req.query.page) - 1 || 0;
    var ttl = 0;
    if(pageNumber == 1){
      ttl = global.FrontPageTTL;
    }else{
      ttl = global.ExtendedPageTTL;
    }
    var pageTitle = "top_" + pageNumber;
    var queryParams = {
      offset: pageNumber*16,
      limit: 16,
      where: {
        type: "movie"
      },
      order: [
        ["imdbRating", "DESC"]
      ],
      attributes: ["imdb_id", "title", "type"]
    }
    queryPageWithCache(database.Movie, queryParams, pageTitle, ttl, function(items){
      res.send(items);
    }, function(error){
      res.send({"error" : JSON.stringify(error)});
    });
  });

  //get movies in alphabetical order
  router.get("/alpha", function(req, res){
    var pageNumber = Number(req.query.page) - 1 || 0;
    var ttl = 0;
    if(pageNumber == 1){
      ttl = global.FrontPageTTL;
    }else{
      ttl = global.ExtendedPageTTL;
    }
    var pageTitle = "alpha_" + pageNumber;
    var queryParams = {
      offset: pageNumber*16,
      limit: 16,
      where: {
        type: "movie"
      },
      order: [
        ["title", "ASC"],
        //secondary sort order to avoid weird pagination bugs
        ["imdbRating", "DESC"]
      ],
      attributes: ["imdb_id", "title", "type"]
    }
    queryPageWithCache(database.Movie, queryParams, pageTitle, ttl, function(items){
      res.send(items);
    }, function(error){
      res.send({"error" : JSON.stringify(error)});
    });
  });

  //Get the list of categories, cached
  router.get("/listcategories", function(req, res){
    cache.get("categories", function(err, value){
      if(!err && value != undefined){
        //cache hit
        res.send(value);
      }else{
        database.Category.findAll().then(function(categories){
          name_list = [];
          categories.forEach(function(category, index){
            name_list.push(category.name);
          });
          var categoriesJson = JSON.stringify(name_list);
          cache.set("categories", categoriesJson, function(err, success){
            if(err){
              logger.error("CACHE_SET_FALURE: categories");
            }
          });
          res.send(categoriesJson);
        });
      }
    });
  });

  //Get movies from a specific category, sorted by popularity and segmented into pages of 16.
  router.get("/category", function(req, res){
    var category_name = req.query.name;
    var page = Number(req.query.page) -1 || 0;
    var ttl = 0;
    if(page == 1){
      ttl = global.FrontPageTTL;
    }else{
      ttl = global.ExtendedPageTTL;
    }
    //try the cache first
    cache.get("category_" + category_name + "_" + page, function(err, value){
      if(!err && value != undefined){
        //request is cache
        ("CACHE_GET_SUCCESS: category_" + category_name + "_" + page);
        res.send(value);
      }else{
        /*
        Either an error occured or the request is not cached.
        Now query database and cache the result.
        */
        database.Category.findOne({
          where: {
            name: category_name
          }
        }).then(function(category){
          if(!category){
            res.send({error: "Category not found"});
            return;
          }
          category.getMovies({
            offset: page*16,
            limit: 16,
            order: [
              ["imdbVotes", "DESC"]
            ],
            attributes: ["imdb_id", "title", "type"]
          }).then(function(movies){
            moviesJson = JSON.stringify(movies);
            //store request result
            cache.set("category_" + category_name + "_" + page, moviesJson, ttl, function(err, success){
              if(err){
                logger.error("CACHE_SET_FAILURE: category_" + category_name + "_" + page);
              }else{
                logger.debug("CACHE_SET_SUCCESS: category_" + category_name + "_" + page)
              }
            });
            //and finally send result
            res.send(moviesJson);
          })
        });
      }
    });
  });

  //Search movie by title
  router.get("/search", function(req, res){
    var title = req.query.title;
    database.Movie.findAll({
      limit: 8,
      where: {
        title: {
          $iLike: "%" + title + "%",
        }
      },
      order: [
        ["imdbVotes", "DESC"]
      ],
      attributes: ["imdb_id", "title", "type"]
    }).then(function(movies){
      res.send(JSON.stringify(movies));
    });
  });

  //Delete a movie by imdb id
  router.get("/remove", auth.requireLogin, function(req, res){
    var movieid = req.query.movieid;
    if(movieid == null || movieid.length == 0){
      res.send({error: "Invalid input"});
      return;
    }
    database.Movie.findOne({
      where: {
        imdb_id: movieid
      }
    }).then(function(movie){
      if(movie == null){
        res.send({error: "DVD not found"});
        return;
      }
      logger.warn("Deleting title: " + movie.title);
      movie.destroy();
      cache.flushAll();
      res.send({result: "DVD deleted"});
    })
  });

  //Deletes categories with fewer than 2 movies in it
  router.get("/cleancategories", auth.requireLogin, function(req, res){
    logger.info("Cleaning categories")
    database.Category.findAll().then(function(categories){
      categories.forEach(function(category, index, array){
        category.getMovies({
          where: {
            type: "movie"
          }
        }).then(function(movies){
          if(movies.length <= 1){
            //small category, delete
            logger.warn("Deleting category: " + category.name);
            category.destroy();
          }
        });
        if(index == array.length - 1){
          //deletions are now complete, clear category list cache
          cache.del("categories");
        }
      });
    });
    res.send("Cleaning categories");
  });

  //clear caches for testing purposes
  router.get("/clearcache", auth.requireLogin, function(req, res){
    cache.flushAll();
    res.send("Cache Clear");
  });

  mod.router = router;
  return mod;
}
