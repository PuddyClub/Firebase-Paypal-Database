module.exports = async function (req, res, http_page, data) {

    try {

        /* 
                // Start Firebase
                const firebase = require('puddy-lib/firebase');
                const tinyCfg = require('../config.json');
                firebase.start(require('firebase-admin'), tinyCfg.options, tinyCfg.firebase);
        
                // App
                const app = firebase.get('main');
                const db = app.db.ref('paypal');
        
                // Get Settings
                let paypal_settings = await firebase.getDBAsync(db.child('settings'));
                paypal_settings = firebase.getDBValue(paypal_settings);
         */

        return http_page.send(res, 200);

    } catch (err) {

        // HTTP Page
        console.error(err);
        return http_page.send(res, 500);

    }

};