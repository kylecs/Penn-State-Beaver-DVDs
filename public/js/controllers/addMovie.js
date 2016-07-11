//controls the addMovie prompt, requests omdb data and posts to our API
app.controller("addMovieController", function($scope, $http, $rootScope){
  $scope.results = [];
  $scope.hasResults = false;
  $scope.loading = false;
  $scope.adding = false;
  $scope.addingTitle = "";

  /*
  Call search on omdb api, store results for display
  */
  $scope.search = function(){
    console.log("Searching for: " + $scope.search_term);
    $scope.loading = true
    $http.get("http://www.omdbapi.com/?s=" + $scope.search_term + "&r=json").then(function(response){
      $scope.results = response.data.Search;
      $scope.hasResults = true;
      $scope.loading = false;
    })
  }

  //Get more data from the omdb api, then request the brmovies server to add the movie
  $scope.addMovie = function(result){
    console.log("Attempting to add dvd: " + result.Title);
    $scope.adding = true;
    $scope.addingTitle = result.Title;
    $scope.loading = false;
    $scope.hasResults = false;
    $scope.results = [];
    $("#searchBox").val("");
    var initial_id = result.imdbID;

    //Call omdb api for more information
    $http.get("http://www.omdbapi.com/?i=" + initial_id).then(function(response){
     var data = response.data;
     console.log("Got omdb api response");

     //Handle omdb request errors
     if(!data.Title){
       console.log("Error getting omdb api info");
       $.notify({
         message: "Error getting data!"
       },{
         placement: {
            from: "top",
            align: "center"
          },
         type: "danger"
       });
       return;
     }

     //Get data from omdb api response
     var title = data.Title;
     var rated = data.Rated;
     var runtime = data.Runtime;
     var type = data.Type;
     var year = data.Year;
     var imdbVotes = data.imdbVotes;
     var imdbRating = data.imdbRating;
     var poster_url = data.Poster;
     var genre_raw = data.Genre;
     var genre_formated = genre_raw.toLowerCase();

     //Format data to send to server
     var postdata = {
       title: title,
       rated: rated,
       runtime: runtime,
       type: type,
       year: year,
       imdbVotes: imdbVotes,
       imdbRating: imdbRating,
       origin_url: poster_url,
       categories: genre_formated,
       imdb_id: initial_id
     }

     //Send addMovie request to brmovies server, posting formatted data
     $http.post("/api/addmovie", postdata).then(function(response){
       console.log("Got brmovies api response");
       $("#addMovieModal").modal("hide");
       $scope.adding = false;

       //Handle server error / connection error / success, notify user of result.
       if(response.data.error){
         console.log("Server Error: " + response.data.error);
         $.notify({
           message: "Couldn't Add DVD: " + response.data.error
         },{
           placement: {
		          from: "top",
		          align: "center"
	          },
           type: "danger"
         });
       }else if(response.data.success){
         console.log("DVD added")
         $rootScope.$broadcast("invalidateLocalCache");
         $.notify({
           message: "DVD Added: " + title
         },{
           placement: {
		          from: "top",
		          align: "center"
	          },
           type: "success"
         });
       }else{
         console.log("Exception contacting api");
         $.notify({
           message: "Couldn't Reach Server"
         },{
           placement: {
		          from: "top",
		          align: "center"
	          },
           type: "danger"
         });
       }
     });
    });
  }

  //Setup event handler to register enter being pressed instead of a click.
  function init(){
    $("#searchBox").keyup(function(event){
        if(event.keyCode == 13){
            $("#searchButton").click();
        }
    });
  }

  init();
});
