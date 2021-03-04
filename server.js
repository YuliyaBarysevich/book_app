'use strict'

// ============== Packages ==============================
const express = require('express');
const superagent = require('superagent');
const pg = require('pg')
const methodOverride = require('method-override')
require('dotenv').config();


// ============== App ===================================
const app = express();
const PORT = process.env.PORT || 3003;
const DATABASE_URL = process.env.DATABASE_URL;

// EJS requires us to have a folder called views where the ejs lives
app.set('view engine', 'ejs');
app.use(express.static('./public'))
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'))



const client = new pg.Client(DATABASE_URL);
client.on('error', error => console.log(error))
// ============== Routes ================================
app.get('/searches/new', renderSearch);
app.post('/searches', getBooksCallback)
app.get('/', displayHomePage) 
app.get('/books/:id', displayOneBook)
app.post('/books', addtoLibrary)
app.get('/books/:id/edit', renderEditForm)
app.put('/books/:id', editBook)

function displayHomePage (req, res){
  const sqlString = 'SELECT * FROM books;';
  client.query(sqlString)
    .then(result => {
      const ejsObject = {allBooks: result.rows}
      // console.log(ejsObject)
      res.render('pages/index.ejs', ejsObject)
    })
}

function displayOneBook(req, res){
  const id = req.params.id;
  const sqlString = 'SELECT * FROM books WHERE id=$1'
  const sqlArray = [id]
  client.query(sqlString, sqlArray)
    .then(result => {
      const chosenBook = result.rows[0];
      const ejsObject = {chosenBook};
      res.render('pages/books/detail.ejs', ejsObject)
    })

}


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
      // console.log(output)
    })
    .catch(error =>{
      console.log(error);
      res.status(500).send(`Sorry something went wrong`);
    });

}

function renderSearch(req, res) {
  res.render('pages/searches/new.ejs')
}

function addtoLibrary(req, res){
  const sqlString = 'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING id;'
  const sqlArray = [req.body.title, req.body.author, req.body.isbn, req.body.image_url, req.body.description]
  client.query(sqlString, sqlArray)
    .then(result => {
      const newBookId = result.rows[0].id;
      res.redirect(`/books/${newBookId}`)
    })
}

function renderEditForm(req, res){
  // const ejsObject = req.body;
  const id = req.params.id;
  const sqlString = 'SELECT * FROM books WHERE id=$1'
  const sqlArray = [id]
  client.query(sqlString, sqlArray)
    .then(result => {
      const chosenBook = result.rows[0];
      const ejsObject = {chosenBook};
      res.render('pages/books/edit.ejs', ejsObject)
    })
}

function editBook(req, res){
  const sqlString = 'UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6'
  const sqlArray = [req.body.title, req.body.author, req.body.isbn, req.body.image_url, req.body.description, req.params.id]
  console.log(req.body)
  client.query(sqlString, sqlArray)
    .then(() =>{
      res.redirect(`/books/${req.params.id}`)
    })
}


function Book(object){
  this.title = object.volumeInfo.title;
  this.author = object.volumeInfo.authors;
  this.isbn = object.volumeInfo.industryIdentifiers[0].identifier;
  this.image_url = object.volumeInfo.imageLinks ? object.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg'
  this.description = object.volumeInfo.description;
}

// ============== Initialization ========================
client.connect().then(() => {
  app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
});
