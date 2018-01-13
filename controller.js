var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request'); 
var cheerio = require('cheerio'); 

var Comment = require('../models/Comment.js');
var Article = require('../models/Article.js');

// articles page
router.get('/articles', function (req, res){

  // Query MongoDB 
  Article.find().sort({_id: -1})

    // populate all comments associated with the articles.
    .populate('comments')

    // sends to handlebars template to be rendered
    .exec(function(err, doc){
      // log any errors
      if (err){
        console.log(err);
      } 
      // or send the doc to the browser as a json object
      else {
        var hbsObject = {articles: doc}
        res.render('index', hbsObject);
        // res.json(hbsObject)
      }
    });

});

router.get('/scrape', function(req, res) {

  // grab body of the html with request
  request('https://www.avclub.com/', function(error, response, html) {

    // load html into cheerio
    var $ = cheerio.load(html);

    var titlesArray = [];

    // Now, grab every everything with a class of "inner" with each "article" tag
    $('article .inner').each(function(i, element) {

        // Create an empty result object
        var result = {};

        // collect title
        result.title = $(this).children('header').children('h2').text().trim() + ""; 

        // collect article link
        result.link = 'https://www.avclub.com/' + $(this).children('header').children('h2').children('a').attr('href').trim();

        // collect summary
        result.summary = $(this).children('div').text().trim() + ""; 
      

        // Error handling to ensure there are no empty scrapes
        if(result.title !== "" &&  result.summary !== ""){

          if(titlesArray.indexOf(result.title) == -1){

            // Push the saved item to our titlesArray to prevent duplicates
            titlesArray.push(result.title);

            // adds entry to database
            Article.count({ title: result.title}, function (err, test){

              if(test == 0){

                var entry = new Article (result);

                // Save the entry to MongoDB
                entry.save(function(err, doc) {
                  // log any errors
                  if (err) {
                    console.log(err);
                  } 
                  // or log the doc that was saved to the DB
                  else {
                    console.log(doc);
                  }
                });

              }
              // Log that scrape is working, just the content was already in the Database
              else{
                console.log('Redundant Database Content. Not saved to DB.')
              }

            });
        }
        // Log that scrape is working, just the content was missing parts
        else{
          console.log('Redundant Content. Not Saved to DB.')
        }

      }
      // Log that scrape is working, just the content was missing parts
      else{
        console.log('Empty Content. Not Saved to DB.')
      }

    });

    // Redirect to the Articles Page, done at the end of the request for proper scoping
    res.redirect("/articles");

  });

});

// comment route
router.post('/add/comment/:id', function (req, res){

  // Collect article id
  var articleId = req.params.id;
  
  // Collect Author Name
  var commentAuthor = req.body.name;

  // Collect Comment Content
  var commentContent = req.body.comment;

  // "result" object has the exact same key-value pairs of the "Comment" model
  var result = {
    author: commentAuthor,
    content: commentContent
  };

  // create a new comment entry
  var entry = new Comment (result);

  // Saves entry to database
  entry.save(function(err, doc) {
    // log any errors
    if (err) {
      console.log(err);
    } 
    // Or, relate the comment to the article
    else {
      // Push the new Comment to the list of comments in the article
      Article.findOneAndUpdate({'_id': articleId}, {$push: {'comments':doc._id}}, {new: true})
      // execute the above query
      .exec(function(err, doc){
        // log any errors
        if (err){
          console.log(err);
        } else {
          // Send Success Header
          res.sendStatus(200);
        }
      });
    }
  });

});

// delete comment route
router.post('/remove/comment/:id', function (req, res){

  // comment id
  var commentId = req.params.id;

  // delete comment by id
  Comment.findByIdAndRemove(commentId, function (err, todo) {  
    
    if (err) {
      console.log(err);
    } 
    else {
      
      res.sendStatus(200);
    }

  });

});

module.exports = router;