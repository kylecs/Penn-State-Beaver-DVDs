module.exports = function(){
  //Cache entry time to live for front pages, in seconds
  global.FrontPageTTL = 3600;

  //Cache entry time to live from secondary pages, which extend the main pages, in seconds
  global.ExtendedPageTTL = 60;

  //How often cache entries are checked for expiration, in seconds
  global.CacheCheckPeriod = 600;

  //detect if app is running on prodution openshift server
  if(process.env.OPENSHIFT_APP_NAME){
    console.log("Production Environment Detected");
    global.Production = true;
  }else {
    console.log("Local Debug Environment Detected");
    global.Production = false;
  }
}
