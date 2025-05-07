const https = require('https');
const http = require('http');
const url = require('url');

exports.handler = async function(event) {
  // Get the image URL from the request
  const imageUrl = event.queryStringParameters.url;
  
  if (!imageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing URL parameter" })
    };
  }

  console.log("Fetching image from:", imageUrl);
  
  try {
    // Parse the URL
    const parsedUrl = new URL(imageUrl);
    
    // Options for the HTTP request
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    // Create a promise to fetch the image
    const response = await new Promise((resolve, reject) => {
      // Choose http or https module based on URL
      const requestModule = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = requestModule.request(options, (res) => {
        // Handle redirects (status codes 301, 302, 307)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Return the redirect URL for handling
          resolve({
            statusCode: 302,
            headers: {
              'Location': event.queryStringParameters.url = res.headers.location
            },
            body: ''
          });
          return;
        }
        
        if (res.statusCode !== 200) {
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: `Failed to load image: ${res.statusMessage}` })
          });
          return;
        }
        
        // Get content type for headers
        const contentType = res.headers['content-type'] || 'image/jpeg';
        
        // Collect data chunks
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        
        res.on('end', () => {
          // Combine chunks into one buffer
          const buffer = Buffer.concat(chunks);
          
          // Return image with appropriate headers
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=86400'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
          });
        });
      });
      
      req.on('error', (err) => {
        console.error("Request error:", err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: `Server error: ${err.message}` })
        });
      });
      
      // Set a timeout (10 seconds)
      req.setTimeout(10000, () => {
        req.abort();
        resolve({
          statusCode: 504,
          body: JSON.stringify({ error: "Request timeout" })
        });
      });
      
      req.end();
    });
    
    return response;
    
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error: ${error.message}` })
    };
  }
};
