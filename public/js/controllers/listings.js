//Controls the movie listings, responds to hash changes and page select requests
app.controller("listingController", function($scope, $http, $window, $rootScope){
  var popularPage = new ListingPage("Popular Movies", "/api/popular", false);
  var newPage = new ListingPage("New Movies", "/api/new", false);
  var topRatedPage = new ListingPage("Top Rated Movies", "/api/top", false);
  var seriesPage = new ListingPage("TV Series", "/api/tv", false);
  var categoryPages = [];
  var ignoreHashChange = false;
  var shouldExtend = true;

  //search tracking
  $scope.showingSearch = false;
  $scope.searchLoading = true;
  $scope.searchTerm = "";
  $scope.searchResults = [];
  $scope.searchChunks = [];

  //Request the current page to extend
  $scope.loadMore = function(){
    console.log("Attepting to load more");
    $scope.currentPage.loadMore($http);
  }

  //Request movie to load full info, request fullMovie dialog controller to show movie
  $scope.selectMovie = function(movie){
    movie.loadFullInfo($http);
    $rootScope.$broadcast("selectFullMovie", movie);
  }

  //Make all pages reload when selected
  $scope.$on("invalidateLocalCache", function(event, arg){
    console.log("Invalidating local cache!");
    popularPage.invalidate();
    newPage.invalidate();
    topRatedPage.invalidate();
    seriesPage.invalidate();
    categoryPages.forEach(function(categoryPage, index, array){
      categoryPage.invalidate();
    });
  });

  //Respond to selectCategory broadcast from navbar
  $scope.$on("selectCategory", function(event, category){
    selectCategory(category);
  });

  /*
  Set a category page, update url hash
  */
  function selectCategory(category){
    $scope.showingSearch = false;
    console.log("selecting category: " + category);
    ignoreHashChange = true;
    $window.location.hash = "#category_" + category;
    if(categoryPages[category] != null){
      //movie already loaded
      console.log("Category info already downloaded");
      $scope.currentPage = categoryPages[category];
    }else{
      //movie not yet loaded
      console.log("Downloading category info");
      categoryPage = new ListingPage("Category: " + category, "/api/category?name=" + category, true);

      categoryPage.loadIfNotLoaded($http, function(){
        if(!categoryPage.failed){
          categoryPages[category] = categoryPage;
          $scope.currentPage = categoryPage;
        }else{
          console.log("Couldn't load category!");
          $window.location.hash = "#popular";
        }
      });
    }
  }

  /*
  Handle page selection requests from navbar
  */
  $scope.$on("selectPopular", function(event, arg){
    console.log("selecting popular");
    ignoreHashChange = true;
    $window.location.hash = "#popular";
    $scope.currentPage = popularPage;
    popularPage.loadIfNotLoaded($http);
    $scope.showingSearch = false;
  });

  $scope.$on("selectSeries", function(event, arg){
    console.log("selecting series");
    ignoreHashChange = true;
    $window.location.hash = "#series";
    $scope.currentPage = seriesPage;
    seriesPage.loadIfNotLoaded($http);
    $scope.showingSearch = false;
  });

  $scope.$on("selectNew", function(event, arg){
    console.log("selecting new");
    ignoreHashChange = true;
    $window.location.hash = "#new";
    $scope.currentPage = newPage;
    newPage.loadIfNotLoaded($http);
    $scope.showingSearch = false;
  });

  $scope.$on("selectTopRated", function(event, arg){
    console.log("selecting top");
    ignoreHashChange = true;
    $window.location.hash = "#top";
    $scope.currentPage = topRatedPage;
    topRatedPage.loadIfNotLoaded($http);
    $scope.showingSearch = false;
  });

  //Request search from server, display results
  $scope.$on("search", function(event, searchTerm) {
    console.log("Searching: " + searchTerm);
    $scope.showingSearch = true;
    $scope.searchTerm = searchTerm;
    $scope.searchLoading = true;
    $scope.searchResults = [];
    $scope.searchChunks = [];

    $http.get("/api/search?title=" + searchTerm).then(function(response){
      var data = response.data;
        if(data){
          if(data.length == 0) {
            $scope.showingSearch = false;
            console.log("no results");
            $.notify({
              message: "No Search Results"
            },{
              placement: {
                 from: "top",
                 align: "center"
               },
              type: "danger"
            });
            return;
          }
          //success, got results
          $scope.searchLoading = false;
          data.forEach(function(val, index, array){
            var mov = new Movie(val.title, val.imdb_id);
            mov.imgurl = "/images/" + mov.imdb_id + ".jpg";
            $scope.searchResults.push(mov);
            if(index == array.length - 1) {
              chunkSearchResults();
            }
          });
        }else {
          console.log("Server Error!");
          $.notify({
            message: "Server Error"
          },{
            placement: {
 		          from: "top",
 		          align: "center"
 	          },
            type: "danger"
          });
          $scope.showingSearch = false;
        }
    }).catch(function(error){
      console.log("Couldn't Reach Server!");
      $.notify({
        message: "Couldn't Reach Server"
      },{
        placement: {
           from: "top",
           align: "center"
         },
        type: "danger"
      });
      $scope.showingSearch = false;
    });
  });

  //convert search results to chunked format for bootstrap row compatability.
  function chunkSearchResults() {
    for(var i = 0; i < $scope.searchResults.length;  i += 4){
      chunk = $scope.searchResults.slice(i, i+4);
      buffer = 4 - chunk.length;
      if(buffer > 4 || buffer < 0){
        buffer = 0;
      }
      if(buffer > 0){
        for(var n = 0; n < buffer; n++){
          chunk.push([]);
        }
      }
      $scope.searchChunks.push(chunk);
  }
}

  //remove search display
  $scope.removeSearch = function() {
    $scope.showingSearch = false;
  }

  //Update current page based on url hash
  function updateHashLocation(){
    var hash = window.location.hash.substring(1);
    $rootScope.$broadcast("setSelection", hash);
    console.log("Hash detected: " + hash);
    if(hash.startsWith("category_")){
      var category = hash.replace("category_", "");
      console.log("Category hash detected: " + category);
      selectCategory(category);
    }else{
      switch(hash){
        case "popular":
          $scope.currentPage = popularPage;
          break;
        case "new":
          $scope.currentPage = newPage;
          break;
        case "top":
          $scope.currentPage = topRatedPage;
          break;
        case "series":
          $scope.currentPage = seriesPage;
          break;
        default:
          $scope.currentPage = popularPage;
          ignoreHashChange = true;
          $window.location.hash = "#popular";
          $rootScope.$broadcast("setSelection", "popular");
          break;
      }
    }
  }

  //Handle hashchange event, update current page if not ignoreHashChange
  $(window).bind("hashchange", function(e){
    if(!ignoreHashChange){
      console.log("Responding to hash change event");
      $scope.showingSearch = false;
      updateHashLocation();
      $scope.currentPage.loadIfNotLoaded($http);
      $scope.$apply();
    }else{
      console.log("Ignoring hash change event");
    }
    ignoreHashChange = false;
  });

  //Setup page and hash
  $(document).ready(function(){
    updateHashLocation();
    $scope.currentPage.loadIfNotLoaded($http);
  });

  //Load more pages when scrolled to the bottom
  $(window).scroll(function(){
    if($(window).scrollTop() + $(window).height() > $(document).height() - 50){

      if(!$scope.currentPage.loading && $scope.currentPage.canLoadMore && shouldExtend){
        shouldExtend = false;
        setTimeout(function() {
          shouldExtend = true;
          console.log("should extend now");
        }, 500);
        $scope.currentPage.loadMore($http);
      }
    }
  });
});
