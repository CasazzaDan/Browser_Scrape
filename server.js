// Require Dependencies
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

// Scraping Tools
var cheerio = require("cheerio");
var axios = require("axios");

// Require All Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

var PORT = 3000;
var app = express();

// Middleware
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

//connect to Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/BrowserScrape";
mongoose.connect(MONGODB_URI);
var db = mongoose.connection;

db.on("error", function (error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function () {
  console.log("Mongoose connection successful.");
});

// Routes
app.get("/", function (req, res) {

});

app.get("/scrape", function (req, res) {
  axios.get("https://www.theonion.com").then(function (response) {

    var $ = cheerio.load(response.data);

    $("article").each(function (i, element) {

      var result = {};

      result.title = $(this).find("header").find("h1.headline").find("a").text();
      result.summary = $(this).find(".entry-summary").find("p").text();
      result.link = $(this).find("header").find("h1.headline").find("a").attr("href");


      var entry = new db.Article(result);

      entry.save(function (err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });
    });
    res.send("Scrape Complete");
    console.log(result);
  });
});

app.get("/articles", function (req, res) {
  Article.find({})
    .then(articles => res.json(articles))
});

app.get("/articles/:id", function (req, res) {
  Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(article => res.json(article))
});

app.post("/articles/:id", function (req, res) {

  var newNote = new Note(req.body);

  newNote.save(function (error, doc) {

    if (error) {
      console.log(error);
    }

    else {

      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
        .exec(function (err, doc) {

          if (err) {
            console.log(err);
          }
          else {

            res.send(doc);
          }
        });
    }
    // Note.create(req.body)
    //   .then(dbNote => db.Article.findOneAndUpdate(
    //     { _id: req.params.id },
    //     { $set: { note: dbNote._id } }
    //   ))
    //   .then(dbArticle => res.json(dbArticle))
    //   .catch(err => res.json(500, err))
  });

  app.listen(PORT, function () {
    console.log("App running on port: " + PORT)
  });
});
