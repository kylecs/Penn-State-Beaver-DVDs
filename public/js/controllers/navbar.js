//Controls the navbar, controls category selections, and loggedin status
app.controller("navbarController", function($rootScope, $scope, $http){
  $scope.categories = [];
  $scope.loggedin = false;

  //Load category list from server
  function loadAllCategories(){
    console.log("loading categories");
    $http.get("/api/listcategories").then(function(response){
      $scope.categories = response.data || [];
      if($scope.categories == []){
        console.log("No categories loaded");
      }else{
        console.log("Categories loaded");
      }
    });
  }

  //Show login prompt dialog
  $scope.requestLoginPrompt = function(){
    console.log("requesting login prompt");
    $("#loginModal").modal("show");
  }

  //Update login status from login controller
  $scope.$on("login", function(event, arg){
    $scope.loggedin = true;
  });

  //Request server to logout
  $scope.logout = function(){
    console.log("logging out");
    $http.get("/auth/logout").then(function(response){
      console.log("Logged out");
      $scope.loggedin = false;
      $.notify({
        message: "Logged Out!"
      },{
        placement: {
           from: "top",
           align: "center"
         },
        type: "success"
      });
    }).catch(function(err){
      console.log("Error reaching server");
      $.notify({
        message: "Error Reaching Server"
      },{
        placement: {
           from: "top",
           align: "center"
         },
        type: "danger"
      });
    });
  }

  //Update selections from request by listing controller
  $scope.$on("setSelection", function(event, selection){
    switch(selection){
      case "popular":
        setPopularActive();
        break;
      case "top":
        setTopActive();
        break;
      case "new":
        setNewActive();
        break;
      case "series":
        setSeriesActive();
        break;
      default:
        setNoneActive();
        break;
    }
  });

  //Handle active class on the selections
  function setSeriesActive(){
    setNoneActive();
    $("#selectSeries").toggleClass("active", true);
  }

  function setPopularActive(){
    setNoneActive();
    $("#selectPopular").toggleClass("active", true);
  }

  function setNewActive(){
    setNoneActive();
    $("#selectNew").toggleClass("active", true);
  }

  function setTopActive(){
    setNoneActive();
    $("#selectTopRated").toggleClass("active", true)
  }

  function setNoneActive(){
    $("#selectPopular").toggleClass("active", false);
    $("#selectNew").toggleClass("active", false);
    $("#selectTopRated").toggleClass("active", false);
    $("#selectSeries").toggleClass("active", false);

  }

  //Handle clicking of a selection
  $scope.selectCategory = function(category){
    $rootScope.$broadcast("selectCategory", category);
    setNoneActive();
  }
  $scope.selectPopular = function(){
    $rootScope.$broadcast("selectPopular");
    setPopularActive();
  }
  $scope.selectNew = function(){
    $rootScope.$broadcast("selectNew");
    setNewActive();
  }
  $scope.selectTopRated = function(){
    $rootScope.$broadcast("selectTopRated");
    setTopActive();
  }
  $scope.selectSeries = function(){
    $rootScope.$broadcast("selectSeries");
    setSeriesActive();
  }

  function init(){
    loadAllCategories();
  }

  init();
});
