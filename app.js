var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter');
var promoRouter = require('./routes/promoRouter');
var leaderRouter = require('./routes/leaderRouter');

const mongoose = require('mongoose');
mongoose.Promise = Promise;

const Dishes = require('./models/dishes');

const options = {
  useMongoClient: true,
  autoIndex: false, // Don't build indexes
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0
};

const url = 'mongodb://localhost:27017/conFusion';
const connect = mongoose.connect(url,  options);

connect.then((db) =>{
  console.log('Connnected correctly to server');
}, (err) => { console.log(err); });

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('12345-67890-09876-54321')); //handle signed cookies

//auth midleware
function auth (req, res, next) {
  console.log(req.signedCookies);

  if(!req.signedCookies.user){
    var authHeader = req.headers.authorization;

    //if authHeader is not present
    if (!authHeader) {
        var err = new Error('You are not authenticated!');

        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        return next(err);    
    }

    var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');

    var user = auth[0];
    var pass = auth[1];

    //default username and password 
    if (user == 'admin' && pass == 'password') {
        //if authorized go to the next midlewear
        //setup the cookie
        res.cookie('user','admin' , { signed: true });
        next(); // authorized
    }
  else {
      var err = new Error('You are not authenticated!');

      res.setHeader('WWW-Authenticate', 'Basic');      
      err.status = 401;
      return next(err);
   }
 }
 else{
   if(req.signedCookies.user === 'admin'){
     next();
   }
   else{
    var err = new Error('You are not authenticated!');

    res.setHeader('WWW-Authenticate', 'Basic');      
    err.status = 401;
    return next(err);
   }
 }

}

app.use(auth);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/dishes', dishRouter);
app.use('/promotions', promoRouter);
app.use('/leaders', leaderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
