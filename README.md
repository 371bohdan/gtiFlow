author Kozatskiy Bohdan

The application is called "water", its main purpose is to add registered users and display their data about water.

The application works on the MongoDB database, written in JavaScript, html/hbs, css styles and covered using bootstrap version 5.3

The application consists of the following parts:

app.js - the base and libraries to make the project work

views – here are CSS and html/hbs templates for rendering the page
models – contains models from the database
.env – confidential data (MONGO_DATABASE_URL, EMAIL_ADDRESS, EMAIL_PASSWORD)
routes – a separate folder for storing different get and post aspects for each url
images – a folder for storing pictures
package.json - a file for storing dependencies app and command enter run app


To use this application you need:
- have your own MongoDB database, whether local or global, to have the ability to process data;
- be sure to create your own SMTP hosting gmail/ukr net before using this application, currently double authentication is required for gmail, access to SMTP hosting is enabled and a 16-digit password for hosting (app password) is generated, this is required to implement the forgotten password functionality;
- there is an .env file in this application, which contains three variables MONGO_DATABASE_URL, EMAIL_ADDRESS, EMAIL_PASSWORD, for security purposes I do not provide them, but if you need to use this application, you need to create this file yourself and enter your own data in MONGO_DATABASE_URL - your URL of the database, EMAIL_ADDRESS – SMTP hosting address, EMAIL_PASSWORD – password from your mail to the application (app password if you search in the gmail settings)

To start working with this application, go to the middle of the project called water and enter the command in the console: npm start

When the application is launched, enter the following in the browser's search engine:
http://localhost:3000/login (port 3000 is not necessary, you may have another port) this is the beginning of this application

The route system is as follows: 
/login - authorization,
/index – your personal main page from there you can see and add data about water (you cannot get to such a page without authorization)
/water – adding data about water (you cannot get to this page without authorization)
/register – registration of new users
/forgot-password – if you forgot your password, you need to enter your registered e-mail, you will be sent a letter and you need to enter it using the specified url
/reset-password/:token – url to reset your password.
You can also add, change your data profile and change data about anlysis water

testing cod 0.3 version
status: complete, error not found
