const express = require('express');
const cors = require('cors');
const app = express();

// Origins that server will accept
const whitelist = ['http://localhost:4500', 'https://localhost:4943', 'http://Vishva-PC:4501'];

var corsOptionsDelegate = (req, callback) => {
    var corsOptions;

    if(whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true};
    }
    else {
        corsOptions = { origin: false};
    }
    
    callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);