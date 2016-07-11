app.controller("loginController", function($scope, $http, $rootScope){
  $scope.password;
  $scope.loading = false;

  //Request login from server
  $scope.login = function(){
    console.log("Login Attempt");
    $scope.loading = true;
    postdata = {
      username: "admin",
      password: $scope.password
    }
    $http.post("/auth/login", postdata).then(function(response){
      console.log(response);
      $scope.password = "";
      $scope.loading = false;
      $("#loginModal").modal("hide");

      if(response.data.loggedin){
        console.log("logged in!");
        $rootScope.$broadcast("login");
        $.notify({
          message: "Logged in"
        },{
          placement: {
             from: "top",
             align: "center"
           },
          type: "success"
        });
      }else{
        console.log("couldn't log in")
        $.notify({
          message: "Couldn't Log In! "
        },{
          placement: {
             from: "top",
             align: "center"
           },
          type: "danger"
        });
      }
    }).catch(function(error){
      $("#loginModal").modal("hide");
      console.log("error reaching server: " + JSON.stringify(error))
      $.notify({
        message: "Error Reaching Server: " + JSON.stringify(error)
      },{
        placement: {
           from: "top",
           align: "center"
         },
        type: "danger"
      });
    });
  }

  //Check if logged in, and setup enter button to act like click
  function init(){
    $("#passwordBox").keyup(function(event){
        if(event.keyCode == 13){
            $("#loginButton").click();
        }
    });
    $http.get("/auth/authstatus").then(function(response){
      console.log(response);
      if(response.data.loggedin){
        console.log("Still Logged In");
        $rootScope.$broadcast("login");
      }
    }).catch(function(error){
      console.log("Error reaching server: " + JSON.stringify(error));
    });
  }

  init();
});
