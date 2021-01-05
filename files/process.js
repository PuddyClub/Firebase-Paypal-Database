module.exports = async function (req, res, data) {

    // Prepare HTTP Page
    const http_page = require('puddy-lib/http/HTTP-1.0');

    // Exist Account Name
    if (typeof req.query.account === "string" && req.query.account.length > 0) {

        // Exist Type String
        if (typeof req.query.type === "string") {

            // Is Sandbox
            if (typeof req.query.sandbox === "string" && (req.query.sandbox === "true" || req.query.sandbox == "false")) {

                // Convert
                if (req.query.sandbox === "true") { req.query.sandbox = true; }
                else if (req.query.sandbox === "false") { req.query.sandbox = false; }

                // IPN
                if (req.query.type === "ipn") {
                    await require('./ipn')(req, res, http_page, data);
                    return;
                }

                // Webhook
                else if (req.query.type === "webhook") {
                    await require('./webhook')(req, res, http_page, data);
                    return;
                }

                // Nope
                else {
                    console.error('Type not found!');
                    return http_page.send(res, 403);
                }
            
            }

            // Nope
            else {
                console.error('Invalid Sandbox Value!');
                return http_page.send(res, 403);
            }

        }

        // Nope
        else {
            console.error('Invalid Type!');
            return http_page.send(res, 403);
        }

    }

    // Nope
    else {
        console.error('Invalid Account Name!');
        return http_page.send(res, 403);
    }

};