const fetch = require('node-fetch');

exports.handler = async function(event) {
  try {
    // Get the image URL from the request
    const imageUrl = event.queryStringParameters.url;
    
    if (!imageUrl) {
      return {
        statusCode: 400,
        body: "Missing URL parameter"
      };
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: `Error fetching image: ${response.statusText}`
      };
    }
    
    // Get image as buffer
    const buffer = await response.buffer();
    
    // Return the image with appropriate headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type'),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Server error: ${error.message}`
    };
  }
};
