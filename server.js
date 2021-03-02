'use strict'

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3003;

app.set('view engine', 'ejs');
app.use(express.static('./public'))
app.use(express.urlencoded({extended:true}));


app.get('/hello', (req, res) => {
  res.render('pages/index')
})




app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));