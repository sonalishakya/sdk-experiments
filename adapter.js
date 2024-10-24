const express = require('express');
const path = require('path');
const url = require('url');
const app = express();

// Set up body-parser to handle form data
app.use(express.urlencoded({ extended: true }));

// Example data source (can be replaced with a database or API)
const dataSource = {
    "webapi.magicpin.in/oms_partner/ondc": {
        "protocols": {
            "magicpin": {
                "base_url": "magicpin://ondc",
                "query_map": {
                    "context.bpp_id": "context.bpp_id",
                    "context.domain": "context.domain",
                    "message.intent.provider.id": "message.intent.provider.id",
                    "context.action": "context.action"
                }
            }
        }
    }
};

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper function to parse beckn:// query parameters
function parseBecknUri(becknUri) {
    const parsedUrl = new URL(becknUri);
    const params = new URLSearchParams(parsedUrl.search);
    const paramObj = {};
    for (let [key, value] of params.entries()) {
        paramObj[key] = value;
    }
    return {
        domain: parsedUrl.hostname,  // Extract domain part
        params: paramObj  // Extract query parameters
    };
}

// Helper function to construct the app-specific URL
function constructAppUri(domain, params, targetApp) {
    const protocolConfig = dataSource[domain]?.protocols[targetApp];
    if (!protocolConfig) return null;

    const { base_url, query_map } = protocolConfig;
    const appParams = new URLSearchParams();

    // Map beckn query parameters to app-specific query parameters
    Object.keys(query_map).forEach(becknKey => {
        if (params[becknKey]) {
            appParams.append(query_map[becknKey], params[becknKey]);
        }
    });

    return `${base_url}?${appParams.toString()}`;
}

// Endpoint to process the submitted beckn:// link
app.post('/process', (req, res) => {
    const becknUri = req.body.becknUrl;  // Get the beckn:// link from the form

    if (!becknUri) {
        return res.status(400).send('Missing beckn:// URI');
    }

    // Parse the beckn:// link
    const { domain, params } = parseBecknUri(becknUri);

    // Define the target app (for this example, we use 'magicpin')
    const targetApp = "magicpin";

    // Construct the app-specific URL
    const appUri = constructAppUri(domain, params, targetApp);

    if (!appUri) {
        return res.status(404).send('No valid redirection URL found');
    }

    // Log the constructed URL
    console.log('Constructed Redirect URL:', appUri);

    // Send the constructed URL as a response before redirecting
    res.send(`
        <h1>Constructed Redirect URL:</h1>
        <p>${appUri}</p>
        <a href="${appUri}">Click here to be redirected</a>
    `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Adapter server running on port ${PORT}`);
});
