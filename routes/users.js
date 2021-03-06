var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
const res = require('express/lib/response');
const req = require('express/lib/request');
var passport = require('passport');
var authenticate = require('../authenticate');
var cors = require('./cors');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
//user list can be accessed only by admin
// "/users" endpoint
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

router.get('/',cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
   //get the users list from the database
   User.find({} , (err,users) => {
     if(err) {
        return next(err);
     }
     else {
       res.statusCode = 200;
       res.setHeader('Content-Type', 'application/json');
       res.json(users);       
     }
   })
});


//signup a user
router.post('/signup',cors.corsWithOptions,  function(req,res,next) {
  User.register( new User({username: req.body.username}), 
  req.body.password , (err, user) =>{

    if(err){
      res.statusCode =500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }

    else{//user signup successfull 
      //if request body contains firstname and last name
      if(req.body.firstname)
        user.firstname = req.body.firstname;
      if(req.body.lastname)
        user.lastname = req.body.lastname;

      user.save((err, user) => {
        //if there is a error in saving changes to the user
        if(err) {
          res.statusCode =500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return;
        }

        passport.authenticate('local')(req,res,() => {
          res.statusCode =200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true , status: 'Registration Successful!'});
        });
      })
    }
  })
});


//login a user
router.post('/login',cors.corsWithOptions,  (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    //if there is an error in authenticating user
    if(err) {
      return next(err);
    }

    //if user is not authenticated
    if(!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful!', err: info});
    }
    req.login(user , (err) => {
      if(err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});
      }

        //create the token including user id
        var token = authenticate.getToken({_id: req.user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Successful!', token: token});
  });

  }) (req, res, next);

});


router.get('/logout', (req, res) => {
  if ( passport.authenticate('local')) {
    res.clearCookie('token');
    res.redirect('/');
  }
  else{
    var err = new Error('You are not loggedin!');
  }
});



// Facebook login
router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
    var token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!'});
  }
});

router.get('/checkJWTToken', cors.corsWithOptions, (req, res) => {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
   if (err) 
    return next(err);

   if (!user) {
     res.statusCode = 401;
     res.setHeader('Content-Type', 'application/json');
     return res.json({status: 'JWT invalid!', success: false, err: info});
   }
   else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.json({status: 'JWT valid!', success: true, user: info});
   }
  }) (req, res);
})

module.exports = router;
