'use strict'

// ============== Packages ==============================
const express = require('express');
const superagent = require('superagent');
require('dotenv').config();


// ============== App ===================================
const app = express();
const PORT = process.env.PORT || 3003;

// EJS requires us to have a folder called views where the ejs lives
app.set('view engine', 'ejs');
app.use(express.static('./public'))
app.use(express.urlencoded({extended:true}));


// ============== Routes ================================
app.get('/searches/new', renderSearch);
app.post('/searches/show', getBooksCallback)

function getBooksCallback(req, res){
  let userChoice = req.body.search
  let url = 'https://www.googleapis.com/books/v1/volumes?q='
  if (userChoice === 'author'){
    url += `inauthor:${req.body.query}`
  }
  if (userChoice === 'title'){
    url += `intitle:${req.body.query}`
  }
  superagent.get(url)
    .then(bookInfo => {
      const output = bookInfo.body.items.map(book => new Book(book))
      res.render('pages/searches/show', {output: output});
    })
    .catch(error =>{
      console.log(error);
      res.status(500).send(`Sorry something went wrong`);
    });

}

function renderSearch(req, res) {
  res.render('pages/searches/new.ejs')
}


app.get('/', (req, res) => {
  res.render('pages/index')
})

function Book(object){
  this.image = object.volumeInfo.imageLinks ? object.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg'
  this.title = object.volumeInfo.title;
  this.author = object.volumeInfo.authors;
  this.description = object.volumeInfo.description
}

// ============== Initialization ========================
app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));