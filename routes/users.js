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
router.get('/', function(req, res, next){
  res.send('respond with a resource');
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
      if(req.body.lasttname)
        user.firstname = req.body.lastname;

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
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else{
    var err = new Error('You are not loggedin!');
  }
});

module.exports = router;
