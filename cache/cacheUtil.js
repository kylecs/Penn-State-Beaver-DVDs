module.exports = function(logger, cache, database){

  //Query database for popular pages, reset cache entry for that
  function regeneratePopularCache(){
    database.Movie.findAll({
      limit: 16,
      where: {
        type: "movie"
      },
      order: [
        ["imdbVotes", "DESC"]
      ],
      attributes: ["imdb_id", "title"]
    }).then(function(movies){
      cache.set("popular_0", JSON.stringify(movies), global.FontPageTTL, function(err, success){
        if(err){
          logger.error("CACHE_SET_FAILURE: popular_0");
        }else{
          logger.debug("CACHE_SET_SUCCESS: popular_0");
        }
      });
    });
  }

  //Query database for newest pages, reset cache entry for that
  function regenerateNewCache(){
    database.Movie.findAll({
      limit: 16,
      where: {
        type: "movie"
      },
      order: [
        ["year", "DESC"]
      ],
      attributes: ["imdb_id", "title"]
    }).then(function(movies){
      cache.set("new_0", JSON.stringify(movies), global.FontPageTTL, function(err, success){
        if(err){
          logger.error("CACHE_SET_FAILURE: new_0");
        }else{
          logger.debug("CACHE_SET_SUCCESS: new_0");
        }
      });
    });
  }

  //Query database for top rates pages, reset cache entry for that
  function regenerateTopCache(){
    database.Movie.findAll({
      limit: 16,
      where: {
        type: "movie"
      },
      order: [
        ["imdbRating", "DESC"]
      ],
      attributes: ["imdb_id", "title"]
    }).then(function(movies){
      cache.set("top_0", JSON.stringify(movies), global.FontPageTTL, function(err, success){
        if(err){
          logger.error("CACHE_SET_FAILURE: top_0");
        }else{
          logger.debug("CACHE_SET_SUCCESS: top_0");
        }
      });
    });
  }

  //Query database for the aphabetical page, reset cache entry for that
  function regenerateAlphaCache(){
    database.Movie.findAll({
      limit: 16,
      where: {
        type: "movie"
      },
      order: [
        ["title", "ASC"],
        ["imdbRating", "DESC"]
      ],
      attributes: ["imdb_id", "title"]
    }).then(function(movies){
      cache.set("alpha_0", JSON.stringify(movies), global.FontPageTTL, function(err, success){
        if(err){
          logger.error("CACHE_SET_FAILURE: alpha_0");
        }else{
          logger.debug("CACHE_SET_SUCCESS: alpha_0");
        }
      });
    });
  }

  //Handle cache entry expiration, regenerate it if it is the front of a main section, such as popular or top
  cache.on("expired", function(key, value){
    logger.debug("CACHE_EXPIRE: " + key);
    switch(key){
      case "popular_0":
        regeneratePopularCache();
        break;
      case "new_0":
        regenerateNewCache();
        break;
      case "top_0":
        regenerateTopCache();
        break;
      case "alpha_0":
        regenerateAlphaCache();
        break;
    }
  });

  //Logs a cache flush, for debugging purposes
  cache.on("flush", function(){
    logger.warn("CACHE FLUSH");
  });

}
