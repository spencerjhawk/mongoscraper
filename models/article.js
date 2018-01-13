// Require Mongoose
var mongoose = require('mongoose');

// Create a Schema Class
var Schema = mongoose.Schema;

// Create Article Schema
var ArticleSchema = new Schema({

  // Title 
  title: {
    type: String,
    required: true
  },

  // Link 
  link: {
    type: String,
    required: true
  },
  
  // Summary of Article
  summary: {
    type: String,
    required: true
  },

  // Date of scrape
  updated: {
    type: String,
    default: moment().format('MMMM Do YYYY, h:mm A')
  },

  // Create relation with comment model
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }]

});

// Create the Article model with Mongoose
var Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;