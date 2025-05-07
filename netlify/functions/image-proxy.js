const https = require('https');
const http = require('http');

exports.handler = async function(event) {
  // Get the image URL from the request
  const imageUrl = event.queryStringParameters.url;
  
  if (!imageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing URL parameter" })
    };
  }

  // Choose http or https module based on URL
  const client = imageUrl.startsWith('https') ? https : http;

  // Create a promise to fetch the image
  return new Promise((resolve, reject) => {
    const request = client.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        resolve({
          statusCode: response.statusCode,
          body: JSON.stringify({ error: `Failed to load image: ${response.statusMessage}` })
        });
        return;
      }
      
      // Get content type for headers
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      // Collect data chunks
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      
      response.on('end', () => {
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
    
    request.on('error', (err) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: `Server error: ${err.message}` })
      });
    });
    
    // Set a timeout (10 seconds)
    request.setTimeout(10000, () => {
      request.abort();
      resolve({
        statusCode: 504,
        body: JSON.stringify({ error: "Request timeout" })
      });
    });
  });
};
