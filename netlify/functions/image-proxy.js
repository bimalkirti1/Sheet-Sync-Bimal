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
    
    console.log(`Attempting to fetch: ${imageUrl}`);
    
    // Use fetch which is available in Netlify Functions environment
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`Error status: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Failed to fetch image: ${response.statusText}` })
      };
    }
    
    // Get image data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get content type
    let contentType = response.headers.get('content-type');
    console.log(`Content-Type from response: ${contentType}`);
    
    if (!contentType || contentType === 'application/octet-stream') {
      if (imageUrl.match(/\.jpe?g$/i)) contentType = 'image/jpeg';
      else if (imageUrl.match(/\.png$/i)) contentType = 'image/png';
      else if (imageUrl.match(/\.gif$/i)) contentType = 'image/gif';
      else if (imageUrl.match(/\.webp$/i)) contentType = 'image/webp';
      else if (imageUrl.match(/\.svg$/i)) contentType = 'image/svg+xml';
      else contentType = 'image/jpeg'; // Default
    }
    
    console.log(`Returning image with Content-Type: ${contentType}, size: ${buffer.length} bytes`);
    
    // Return the image
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      },
      isBase64Encoded: true,
      body: buffer.toString('base64')
    };
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Server error: ${error.message}` })
    };
  }
};
