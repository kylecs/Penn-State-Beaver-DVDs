module.exports = function(Sequelize){
  var module = {};

  //Connect to database
  module.sequelize = new Sequelize(process.env.OPENSHIFT_POSTGRESQL_DB_URL || "postgresql://postgres:password@localhost/moviesdb");

  //Database object for movies, most data is only used for sorting
  module.Movie = module.sequelize.define("movie",{
    imdb_id: Sequelize.STRING,
    title: Sequelize.STRING,
    imdbRating: Sequelize.FLOAT,
    imdbVotes: Sequelize.INTEGER,
    year: Sequelize.STRING,
    type: Sequelize.STRING,
    runtime: Sequelize.INTEGER,
    rated: Sequelize.STRING,
    hasSeasons: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    startSeason: {
      type: Sequelize.INTEGER,
      defaultValue: -1
    },
    endSeason: {
      type: Sequelize.INTEGER,
      defaultValue: -1
    }
  });

  //Category of movie, movies are added to categories on creation
  module.Category = module.sequelize.define("category", {
    name: Sequelize.STRING
  });

  //Setup object relations
  module.Movie.belongsToMany(module.Category, {through: "MovieCategory"});
  module.Category.belongsToMany(module.Movie, {through: "MovieCategory"})

  //Sync which postgres
  module.sequelize.sync()

  return module;
}
