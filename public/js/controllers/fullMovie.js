//Controls fullMovie dialog
app.controller("fullMovie", function($scope, $http, $rootScope){
  $scope.movie = {};

  //Handle request to expand movie info
  $scope.$on("selectFullMovie", function(event, movie){
    $scope.movie = movie;
    $("#fullMovieModal").modal("show");
  });

  //Handle delete button push
  $scope.deleteMovie = function(movie){
    console.log("Delete movie request: " + movie.title);
    $("#fullMovieModal").modal("hide");

    //Send server request
    $http.get("/api/remove?movieid=" + movie.imdb_id).then(function(response){
      var data = response.data;
      if(data.error){
        console.log("Server error: " + data.error);
        $.notify({
          message: "Error deleting movie: " + data.error
        },{
          placement: {
             from: "top",
             align: "center"
           },
          type: "danger"
        });
      }else if(data.result){
        console.log("Movie deleted");
        $rootScope.$broadcast("invalidateLocalCache");
        $.notify({
          message: "DVD deleted, refresh page to see result"
        },{
          placement: {
             from: "top",
             align: "center"
           },
          type: "success"
        });
      }else{
        console.log("Internal Server Error");
        $.notify({
          message: "Internal Server Error"
        },{
          placement: {
             from: "top",
             align: "center"
           },
          type: "danger"
        });
      }
    }).catch(function(error){
      console.log("Exception connecting to server");
      $.notify({
        message: "Couldn't Reach Server"
      },{
        placement: {
           from: "top",
           align: "center"
         },
        type: "danger"
      });
    });
  }
})
