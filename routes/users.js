var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
const res = require('express/lib/response');
const req = require('express/lib/request');
var passport = require('passport');
var authenticate = require('../authenticate');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
//user list can be accessed only by admin
// "/users" endpoint
router.get('/', authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
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
router.post('/signup', function(req,res,next) {
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
router.post('/login', passport.authenticate('local'), (req, 
  res) => {

    //create the token including user id
    var token = authenticate.getToken({_id: req.user._id})

    res.statusCode =200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true ,token: token, status: 'Login Successful!'});
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

module.exports = router;
