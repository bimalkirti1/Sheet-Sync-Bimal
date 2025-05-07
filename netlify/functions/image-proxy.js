const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle OPTIONS requests (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  try {
    // Get image URL from query parameter
    const imageUrl = event.queryStringParameters.url;
    
    if (!imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing URL parameter' })
      };
    }
    
    console.log(`Proxying request to: ${imageUrl}`);
    
    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        // Pretend to be a browser to avoid some server restrictions
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Failed to fetch image: ${response.statusText}` })
      };
    }
    
    // Get image data as buffer
    const imageBuffer = await response.buffer();
    
    // Get content type from response or infer from URL
    let contentType = response.headers.get('content-type');
    if (!contentType || contentType === 'application/octet-stream') {
      if (imageUrl.match(/\.jpe?g$/i)) contentType = 'image/jpeg';
      else if (imageUrl.match(/\.png$/i)) contentType = 'image/png';
      else if (imageUrl.match(/\.gif$/i)) contentType = 'image/gif';
      else if (imageUrl.match(/\.webp$/i)) contentType = 'image/webp';
      else if (imageUrl.match(/\.svg$/i)) contentType = 'image/svg+xml';
      else contentType = 'image/jpeg'; // Default
    }
    
    // Return the image with appropriate headers
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      },
      isBase64Encoded: true,
      body: imageBuffer.toString('base64')
    };
  } catch (error) {
    console.log('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Server error: ${error.message}` })
    };
  }
};
