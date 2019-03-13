const express = require('express')
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const app = express();

//mongoose.connect('mongodb://root:bu6tCY9W52k3@localhost/local');
mongoose.connect('mongodb://localhost/local');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Conectado a DB....");
});
//console.log("db => ", db);
var dbmodel = mongoose.model('startup_log',new Schema({ hostname: String }));
dbmodel.findOne(function(error, result) { 
	/* ... */ 
	console.log("Finding ", error, result);
	});
app.get('/', (req, res) => res.send('Hello World!'))
app.listen(3000, () => console.log('Example app listening on port 3000!'))