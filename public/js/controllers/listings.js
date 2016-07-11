//Controls the movie listings, responds to hash changes and page select requests
app.controller("listingController", function($scope, $http, $window, $rootScope){
  var popularPage = new ListingPage("Popular Movies", "/api/popular", false);
  var newPage = new ListingPage("New Movies", "/api/new", false);
  var topRatedPage = new ListingPage("Top Rated Movies", "/api/top", false);
  var seriesPage = new ListingPage("TV Series", "/api/tv", false);
  var categoryPages = [];
  var ignoreHashChange = false

  //Request the current page to extend
  $scope.loadMore = function(){
    console.log("Attepting to load more");
    $scope.currentPage.loadMore($http);
  }

  //Request movie to load full info, request fullMovie dialog controller to show movie
  $scope.selectMovie = function(movie){
    $scope.currentPage.showFullInfo($http, movie);
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
  });

  $scope.$on("selectSeries", function(event, arg){
    console.log("selecting series");
    ignoreHashChange = true;
    $window.location.hash = "#series";
    $scope.currentPage = seriesPage;
    seriesPage.loadIfNotLoaded($http);
  });

  $scope.$on("selectNew", function(event, arg){
    console.log("selecting new");
    ignoreHashChange = true;
    $window.location.hash = "#new";
    $scope.currentPage = newPage;
    newPage.loadIfNotLoaded($http);
  });

  $scope.$on("selectTopRated", function(event, arg){
    console.log("selecting top");
    ignoreHashChange = true;
    $window.location.hash = "#top";
    $scope.currentPage = topRatedPage;
    topRatedPage.loadIfNotLoaded($http);
  });

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
      if(!$scope.currentPage.loading && $scope.currentPage.canLoadMore){
        $scope.currentPage.loadMore($http);
      }
    }
  });

});
