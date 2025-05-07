const fetch = require('node-fetch');

exports.handler = async function(event) {
  // Get the image URL from the request
  const imageUrl = event.queryStringParameters.url;
  
  if (!imageUrl) {
    return {
      statusCode: 400,
      body: "Please provide an image URL"
    };
  }

  try {
    // Fetch the image
    console.log("Getting image from:", imageUrl);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Couldn't get the image: ${response.status}`);
    }
    
    // Get image data
    const imageBuffer = await response.buffer();
    
    // Send it back with special headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',  // This allows anyone to use our helper
        'Cache-Control': 'public, max-age=86400'  // Remember the image for a day
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.log("Error getting image:", error);
    return {
      statusCode: 500,
      body: `Error: ${error.message}`
    };
  }
};
