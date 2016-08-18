/*
  A page of movies, contains functionality for downloading the page and extending it
*/
var ListingPage = function(title, apiUrl, urlParamsExist){
  this.loaded = false;
  this.loading = false;
  this.canLoadMore = true;
  this.movies = [];
  this.chunked = false;
  this.chunkedData = [];
  this.apiUrl = apiUrl;
  this.curPage = 1;
  this.failed = false;
  this.title = title;

  //we add this meaningless param so that we can always append &page= to our queries to get more pages
  if(!urlParamsExist){
    this.apiUrl = this.apiUrl + "?1=1"
  }
}

//Load the initial page from the server
ListingPage.prototype.loadPage = function($http, done){
  var self = this;
  self.movies = [];
  self.chunked = [];
  $http.get(this.apiUrl).then(function(response){
    data = response.data || [];
    data.forEach(function(val, index, array){
      self.movies.push(new Movie(val.title, val.imdb_id, val.type));
    });
    if(self.movies.length < 16){
      self.canLoadMore = false;
    }
    self.movies.forEach(function(movie, index){
      movie.imgurl = "/images/" + movie.imdb_id + ".jpg";

    });
    self.chunkData();
    self.loaded = true;
    self.loading = false;
    console.log(self.movies);
    if(done){
      done();
    }
  }).catch(function(e){
    self.failed = true;
    //maybe notify here
    console.log("Failed to load page: " + JSON.stringify(e));
    if(done){
      done();
    }
  });
}

//Load a page if it has not been previously loaded or has been invalidated.
ListingPage.prototype.loadIfNotLoaded = function($http, done){
  if(!this.loaded && !this.loading){
    this.loadPage($http, done);
  }
}

/*
Make the page reload on next select, usefull for getting more immediate updates
when adding or removing movies to a page
*/
ListingPage.prototype.invalidate = function(){
  this.loaded = false;
  this.curPage = 1;
}

//Load more movies in the current section
ListingPage.prototype.loadMore = function($http){
  console.log(this.apiUrl);
  var self = this;
  this.curPage += 1;
  this.loading = true;
  $http.get(self.apiUrl + "&page=" + self.curPage).then(function(response){
    data = response.data || [];
    if(data.length < 16){
      self.canLoadMore = false;
    }
    if(data.length == 0){
      self.loading = false;
      return;
    }
    var new_movies = [];
    data.forEach(function(val, index, array){
      new_movies.push(new Movie(val.title, val.imdb_id, val.type));
    });
    new_movies.forEach(function(movie, index){
      //movie.imgurl = "http://imgserv1-rootns.rhcloud.com/static/" + movie.imdb_id + ".jpg";
      movie.imgurl = "/images/" + movie.imdb_id + ".jpg";
    });
    console.log(new_movies);
    self.movies = self.movies.concat(new_movies);
    console.log(self.movies);
    self.loading = false;
    self.chunkData();
  }).catch(function(e){
    self.failed = true;
    console.log("Failed to load page: " + JSON.stringify(e));
  });
}

//Segment data into chunks of 4, padding with empty objects if necessary
ListingPage.prototype.chunkData = function(){
  this.chunkedData = [];
  for(var i = 0; i < this.movies.length;  i += 4){
    chunk = this.movies.slice(i, i+4);
    buffer = 4 - chunk.length;
    if(buffer > 4 || buffer < 0){
      buffer = 0;
    }
    if(buffer > 0){
      for(var n = 0; n < buffer; n++){
        chunk.push([]);
      }
    }
    this.chunkedData.push(chunk);
    this.chunked = true;
  }
}

//Get chunked data, and chunk it if it has not been chunked yet.
ListingPage.prototype.getChunkedData = function(){
  if(!this.chunked){
    this.chunkData();
  }
  return this.chunkedData;
}
