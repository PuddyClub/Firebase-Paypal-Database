module.exports = async function (req, res, http_page, data) {

    try {

/* 
        // Create Settings
        const tinyCfg = _.defaultsDeep({}, data.firebase, {
            options: {
                id: "main",
                autoStart: {
                    database: true
                }
            }
        });

        // Custom Module Config
        const custom_modules = _.defaultsDeep({}, data.modules, {

            // Webhook Actions
            webhook: {

                // Custom Buy
                custom: [],

                // Custom Buy
                default: []

            }

        });

        // Start Firebase
        const firebase = require('puddy-lib/firebase');
        firebase.start(require('firebase-admin'), tinyCfg.options, tinyCfg.firebase);

        // App
        const app = firebase.get(tinyCfg.options.id);
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