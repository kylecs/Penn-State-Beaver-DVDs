# Penn State Movies Website

This is the code that powers the DVD catalog for all DVDs
available at the Penn State Beaver Library. The website supports sorting available
DVDs by several parameters, including age and category.

Notice: Website has been shutdown.

## Technical Specifications:

### Overview
The website is a single page app that downloads content from the backend server
dynamically using a hidden api that my server provides.

### Backend
The server is hosted on the free tier of openshift, running on nodejs with express.
The database is provided through postgres. Other notable backend dependencies
include Sequelize for database interaction, request for handling image
downloads, winston for logging, and node-cache for caching api results.

### Frontend
The frontend is a single page application that downloads content dynamically.
This is done primarily with Angular.js and Jquery. Bootstrap and bootstrap-notify
are used for styling and user experience.
