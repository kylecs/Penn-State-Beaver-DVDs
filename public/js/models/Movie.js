var Movie = function(title, imdb_id){
  this.fullInfoLoaded = false;
  this.title = title;
  this.imdb_id = imdb_id;
  this.failedLoad = false;
  this.loading = false;
  this.fullData = {};
}

//Load full movie info from omdb,
Movie.prototype.loadFullInfo = function($http){
  var self = this;
  self.loading = true;
  $http.get("http://omdbapi.com?plot=full&r=json&i=" + self.imdb_id).then(function(result){
    self.loading = false;
    if(result.data){
      self.fullData = result.data
      self.fullInfoLoaded = true;
    }else{
      self.failedLoad = false;
    }
  });
}
