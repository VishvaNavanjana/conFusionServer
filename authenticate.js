var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
//take user information
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey, 
        {expiresIn: 3600});//3600 seconds
};


//options for jwt based strategy
var opts = {};
//specify how jwt token extracted from the incoming request
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, 
    (jwt_payload, done) => {
        //done is callback
    console.log("JWT payload: ",jwt_payload);
    User.findOne({_id: jwt_payload._id}, (err, user) =>{
        if(err) {
            return done(err, false);
        }
        else if(user){
            //if user is not null
            return done(null, user);
        }
        else{
            //user not found
            return done(null, false);
        }
    });
 }));

//verify an incoming user
exports.verifyUser = passport.authenticate('jwt',{session: false});//because we are using jwt based auth(not using sessions)

//function to check whether ordinary user is admin or not
exports.verifyAdmin = function(req, res, next){
    if(req.user.admin){
        next();
    }
    else{
        var err = new Error("You are not authorized to perform this operation");
        err.status = 403;
        next(err);
    }
};

exports.facebookPassport = passport.use(new FacebookTokenStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret
    }, (accessToken, refreshToken, profile, done) => {
        User.findOne({facebookId: profile.id}, (err, user) => {
            if (err) {
                return done(err, false);
            }
            if (!err && user !== null) {
                return done(null, user);
            }
            else {
                user = new User({ username: profile.displayName });
                user.facebookId = profile.id;
                user.firstname = profile.name.givenName;
                user.lastname = profile.name.familyName;
                user.save((err, user) => {
                    if (err)
                        return done(err, false);
                    else
                        return done(null, user);
                })
            }
        });
    }
));



// exports.facebookPassport = passport.use(new FacebookTokenStrategy({
//     clientID: config.facebook.clientId,
//     clientSecret: config.facebook.clientSecret
// }, (accessToken, refreshToken, profile, done) => {
//     User.findOne({facebookId: profile.id}, (err, user) => {
//         if (err) {
//             return done(err, false);
//         }
//         if (!err && user !== null) {
//             return done(null, user);
//         }
//         else {
//             user = new User({ username: profile.displayName });
//             user.facebookId = profile.id;
//             user.firstname = profile.name.givenName;
//             user.lastname = profile.name.familyName;
//             user.save((err, user) => {
//                 if (err)
//                     return done(err, false);
//                 else
//                     return done(null, user);
//             })
//         }
//     });
// }
// ));