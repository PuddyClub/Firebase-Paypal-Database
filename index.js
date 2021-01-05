// Base
const paypalModule = {};

// Start
paypalModule.start = function (data) {
    const express = require('firebase-webhook-express-default');
    paypalModule.app = express(async (req, res) => {

        // Action
        await require('./files/process')(req, res, data);

        // Final Script
        return;

    });
};

// Module
module.exports = paypalModule;