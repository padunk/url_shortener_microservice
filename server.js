'use strict';

const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const sha1 = require('sha1');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.MONGOLAB_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

const shortUrlSchema = new mongoose.Schema({
   url: String,
   hash: String,
});

const ShortUrlModel = mongoose.model('ShortUrl', shortUrlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
   res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/invalid', (req, res) => {
   res.sendFile(process.cwd() + '/views/invalid.html');
});

app.get('/api/shorturl/:hash', (req, res) => {
   let hash = req.params.hash;
   ShortUrlModel.findOne(
      {
         hash,
      },
      'url',
      (err, data) => {
         if (err) {
            console.error(err);
            return;
         }
         console.log(data.url);
         res.redirect(data.url);
         res.end();
      }
   );
});

// your first API endpoint...
app.post('/api/shorturl/new', function(req, res) {
   let url = req.body.url;
   let checkURL = url.slice(url.indexOf('.') + 1);

   let options = {
      family: 4,
      hints: dns.ADDRCONFIG | dns.V4MAPPED,
      verbatim: true,
   };
   dns.lookup(checkURL, options, (err, adress) => {
      if (err !== null) {
         console.log(err);
         res.redirect('/invalid');
         return;
      }
      console.log('dns is valid');
      console.log(sha1(url));

      let short = new ShortUrlModel({
         url,
         hash: sha1(url),
      });

      ShortUrlModel.findOne(
         {
            hash: sha1(url),
         },
         'url',
         (err, data) => {
            if (err) {
               console.error(err);
               return;
            }
            if (data === null) {
               short.save((err, data) => {
                  if (err) {
                     console.error(err);
                     return;
                  }
                  console.log(data);
               });
            }
            res.json({
               original_url: url,
               short_url: sha1(url),
            });
            res.end();
         }
      );
   });
});

app.listen(port, function() {
   console.log('Node.js listening on port 3000');
});
