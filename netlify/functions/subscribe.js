// Netlify serverless function to subscribe emails to Mailchimp
// Environment variable required: MAILCHIMP_API_KEY

const MAILCHIMP_SERVER = 'us1';
const MAILCHIMP_AUDIENCE_ID = '008995661b';

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // CORS headers for the frontend
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse the request body
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Get API key from environment variable
    const apiKey = process.env.MAILCHIMP_API_KEY;

    if (!apiKey) {
      console.error('MAILCHIMP_API_KEY environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Mailchimp API endpoint
    const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

    // Make request to Mailchimp
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed'  // Use 'pending' if you want double opt-in
      })
    });

    const data = await response.json();

    // Handle Mailchimp response
    if (response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Successfully subscribed!' })
      };
    } else if (data.title === 'Member Exists') {
      // Already subscribed - treat as success
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Already subscribed!' })
      };
    } else {
      console.error('Mailchimp error:', data);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.detail || 'Subscription failed' })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
