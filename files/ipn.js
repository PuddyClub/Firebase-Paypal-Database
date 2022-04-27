// Credits
// https://github.com/Epictetus/paypal-ipn
module.exports = async function(req, res, http_page, data, logger) {

    // Send Debug Error
    let debugSent = false;
    const debugError = async function() { if (data.warnError && !debugSent) { debugSent = true;
            await logger.error('Result Error Requiest:', req.body, req.headers); } return; };

    try {

        // Prepare Modules
        const objType = require('@tinypudding/puddy-lib/get/objType');

        // Prepare Verify 
        if (typeof req.body === "undefined") {
            await logger.error(new Error('Invalid Post!'));
            return http_page.send(res, 403);
        }

        req.body.cmd = '_notify-validate';

        // Lodash Module
        const _ = require('lodash');

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

            // IPN Actions
            ipn: {

                // Custom Buy
                custom: [],

                // Custom Buy
                default: []

            }

        });

        // Start Firebase
        const firebase = require('@tinypudding/firebase-lib');
        firebase.start(require('firebase-admin'), tinyCfg.options, tinyCfg.firebase);

        // App
        const app = firebase.get(tinyCfg.options.id);
        const db = app.db.ref('paypal');

        // Get Settings
        let paypal_settings = await firebase.getDBAsync(db.child('settings').child(firebase.databaseEscape(req.query.account)));
        paypal_settings = firebase.getDBValue(paypal_settings);

        // Exist Config
        if (paypal_settings) {

            // Check Email
            const check_email = function(email) {

                // Confirmation
                let cofirmed = false;

                // Validator
                if (objType(paypal_settings.emails, 'object') || Array.isArray(paypal_settings.emails)) {
                    for (const item in paypal_settings.emails) {
                        if (paypal_settings.emails[item] === email) {
                            cofirmed = true;
                            break;
                        }
                    }
                }

                return cofirmed;

            };

            // Check Emails
            let validator_email = false;

            // Receiver Email
            validator_email = check_email(req.body.receiver_email);

            // Receiver ID
            if (!validator_email) {
                validator_email = check_email(req.body.receiver_id);
            }

            // Receiver ID
            if (!validator_email) {
                validator_email = check_email(req.body.business);
            }

            // Confirm to Continue
            if (validator_email) {

                // Is Sandbox
                const isSandbox = (req.query.sandbox || req.body.test_ipn);

                // Get Module
                const ipn = require('paypal-ipn');

                return ipn.verify(req.body, { 'allow_sandbox': isSandbox }, async function callback(err) {

                    // Final Result
                    try {

                        // Success
                        if (!err) {

                            // Get Account
                            let account = db.child(firebase.databaseEscape(req.query.account)).child('ipn');

                            // Normal
                            if (!isSandbox) {
                                account = account.child('live');
                            }

                            // Test
                            else {
                                account = account.child('sandbox');
                            }

                            // Extra DB Actions Prepare
                            let db_prepare = null;

                            // Exist Custom Module
                            const custom_module_manager = require('@tinypudding/puddy-lib/libs/custom_module_loader');
                            const exist_custom_module = custom_module_manager.validator(custom_modules, 'ipn');
                            const custom_module_options = { default: false, custom: false };

                            // Send Information
                            const sendInformation = async function(itemNumber, data) {
                                return new Promise(function(resolve, reject) {

                                    // Information
                                    const final_data = {};

                                    // Detect Custom
                                    let the_custom = null;

                                    // Prepare Data
                                    data = { normal: data };

                                    // Convert Data
                                    data.firebase = {};
                                    for (const item in data.normal) {
                                        data.firebase[item] = firebase.databaseEscape(data.normal[item]);
                                    }

                                    // Get Rest Data
                                    for (const item in req.body) {
                                        if (
                                            item !== "item_name" && item !== "item_number" && item !== "quantity" &&
                                            !item.startsWith("item_name") && !item.startsWith("item_number") && !item.startsWith("quantity")
                                        ) {

                                            // Normal Value
                                            if (item !== "custom") {
                                                final_data[item] = req.body[item];
                                            }

                                            // Custom
                                            else if (typeof req.body[item] === "string" && req.body[item].length > 0 && req.body[item] !== "global") {
                                                the_custom = req.body[item];
                                            }

                                        }
                                    }

                                    // Get Quantity
                                    final_data.quantity = getQuantity(itemNumber);

                                    // Rest Information
                                    final_data.item_name = data.normal.name;
                                    final_data.item_number = data.normal.number;

                                    if (data && data.firebase && data.firebase.name && data.firebase.number) {

                                        // Prepare Things of the Custom Module
                                        if (exist_custom_module) {

                                            // Prepare Main Base
                                            if (!db_prepare) {
                                                db_prepare = { items: {} };
                                            }

                                            // Insert Items
                                            if (!db_prepare.items[data.firebase.name]) {
                                                db_prepare.items[data.firebase.name] = {};
                                            }
                                            if (!db_prepare.items[data.firebase.name][data.firebase.number]) {
                                                db_prepare.items[data.firebase.name][data.firebase.number] = {};
                                            }

                                        }

                                        // Result
                                        if (typeof the_custom !== "string") {

                                            // Nope Custom
                                            if (exist_custom_module) { db_prepare.isCustom = false;
                                                custom_module_options.default = true; }

                                            // The DB
                                            const the_data_db = account.child('default').child(data.firebase.name).child(data.firebase.number);

                                            // Insert Default
                                            if (exist_custom_module) { db_prepare.items[data.firebase.name][data.firebase.number] = the_data_db; }

                                            // Insert Value
                                            the_data_db.set(final_data).then(() => {
                                                resolve();
                                                return;
                                            }).catch(err => {
                                                reject(err);
                                                return;
                                            });;

                                        }

                                        // Custom Result
                                        else {

                                            // Is Custom
                                            if (exist_custom_module) { db_prepare.isCustom = true;
                                                custom_module_options.custom = true; }

                                            // The DB
                                            const the_custom_data_db = account.child(firebase.databaseEscape(the_custom)).child(data.firebase.name).child(data.firebase.number);

                                            // Insert Custom
                                            if (exist_custom_module) {
                                                db_prepare.items[data.firebase.name][data.firebase.number] = the_custom_data_db;
                                                db_prepare.custom_name = the_custom;
                                            }

                                            // Insert Value
                                            the_custom_data_db.set(final_data).then(() => {
                                                resolve();
                                                return;
                                            }).catch(err => {
                                                reject(err);
                                                return;
                                            });

                                        }

                                    } else { resolve(); }

                                    // Complete
                                    return;

                                });
                            };

                            // Get Quantity
                            const getQuantity = function(the_item = null) {

                                // Exist Value
                                if (the_item) {

                                    // Get the Value
                                    if (typeof req.body['quantity' + String(the_item)] === "string" || typeof req.body.quantity['quantity' + String(the_item)] === "number") {
                                        return Number(req.body['quantity' + String(the_item)]);
                                    }

                                    // Get Default
                                    else if (typeof req.body.quantity === "string" || typeof req.body.quantity === "number") {
                                        return Number(req.body.quantity);
                                    }

                                    // Nope
                                    else {
                                        return null;
                                    }

                                }

                                // Nope
                                else {

                                    // Get Default
                                    if (typeof req.body.quantity === "string" || typeof req.body.quantity === "number") {
                                        return Number(req.body.quantity);
                                    }

                                    // Nope
                                    else {
                                        return null;
                                    }

                                }

                            };

                            // Main Item
                            if ((typeof req.body.item_name === "string" && typeof req.body.item_number === "string") && typeof req.body.item_number === "string" && typeof req.body.item_number === "string") {
                                await sendInformation(null, { name: req.body.item_name, number: req.body.item_number });
                            }

                            // Prepare Other Items

                            // For Promise
                            const forPromise = require('for-promise');

                            // Prepare Do Whilte Data
                            const item_try = { count: 1 };

                            // Start the Promise
                            await forPromise({

                                // Prepare Settings
                                type: 'while',
                                while: item_try,

                                // The Value will be checked here
                                checker: function() {
                                    const countItem = req.body['item_name' + String(item_try.count)];
                                    return ((typeof countItem === "string" && countItem.length > 0) || (typeof countItem === "number" && !isNaN(countItem)));
                                }

                            }, function(fn, fn_error) {

                                // Index
                                const tiny_index = item_try.count;

                                // Get Items
                                const item = req.body['item_name' + String(tiny_index)];
                                const item2 = req.body['item_number' + String(tiny_index)];

                                // Send Information
                                if ((typeof item === "string" || typeof item === "number") && (typeof item2 === "string" || typeof item2 === "number")) {

                                    // Add Count
                                    item_try.count++;

                                    sendInformation(tiny_index, { name: item, number: item2 }).then(() => {
                                        fn();
                                        return;
                                    }).catch(err => {
                                        fn_error(err);
                                        return;
                                    });

                                }

                                // Nope
                                else {

                                    // Add count and continue
                                    item_try.count++;
                                    fn();

                                }

                                // Complete
                                return;

                            });

                            // Send Info
                            await account.child('global').set(req.body);

                            // Extra Actions Manager for Paypal Start
                            if (db_prepare && exist_custom_module) {
                                await custom_module_manager.run(custom_modules, db_prepare, 'ipn', custom_module_options);
                            }

                            // Complete
                            return http_page.send(res, 200);

                        }

                        // Nope
                        else {
                            await logger.error(err);
                            await debugError();
                            return http_page.send(res, 401);
                        }

                    } catch (err) {

                        // HTTP Page
                        await logger.error(err);
                        await debugError();
                        return http_page.send(res, 500);

                    }

                });

            }

            // Nope
            else {
                await logger.warn(new Error('Invalid Receiver Email!'));
                return http_page.send(res, 401);
            }

        }

        // Nope
        else {
            await logger.warn(new Error('Invalid Account!'));
            return http_page.send(res, 401);
        }

    } catch (err) {

        // HTTP Page
        await logger.error(err);
        await debugError();
        return http_page.send(res, 500);

    }

};