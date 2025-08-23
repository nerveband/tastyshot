// Serverless function to handle Replicate API calls server-side
// This avoids CORS issues by using the Node.js client on the server
import Replicate from 'replicate';

export default async function handler(req, res) {
  console.log('=== REPLICATE API HANDLER START ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { action, model, input } = req.body;
    
    console.log('Parsed request:', { action, model, inputKeys: Object.keys(input || {}) });
    
    // Check environment variables
    console.log('Environment check:');
    console.log('- REPLICATE_API_TOKEN exists:', !!process.env.REPLICATE_API_TOKEN);
    console.log('- VITE_REPLICATE_API_TOKEN exists:', !!process.env.VITE_REPLICATE_API_TOKEN);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
    
    // Get API token from environment (try both names for compatibility)
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || process.env.VITE_REPLICATE_API_TOKEN;
    
    if (!REPLICATE_API_TOKEN) {
      console.error('No API token found in environment variables');
      return res.status(500).json({ 
        error: 'Replicate API token not configured',
        details: 'REPLICATE_API_TOKEN or VITE_REPLICATE_API_TOKEN environment variable is missing',
        debug: {
          env_keys: Object.keys(process.env).filter(key => key.includes('REPLICATE'))
        }
      });
    }
    
    console.log('API token found, length:', REPLICATE_API_TOKEN.length);
    console.log('Token starts with:', REPLICATE_API_TOKEN.substring(0, 5) + '...');

    // Initialize Replicate client server-side
    console.log('Initializing Replicate client...');
    let replicate;
    try {
      replicate = new Replicate({
        auth: REPLICATE_API_TOKEN,
      });
      console.log('Replicate client initialized successfully');
    } catch (initError) {
      console.error('Failed to initialize Replicate client:', initError);
      throw new Error(`Replicate client initialization failed: ${initError.message}`);
    }

    let result;

    switch (action) {
      case 'run':
        try {
          console.log('=== STARTING REPLICATE.RUN ===');
          console.log('Model:', model);
          console.log('Input details:', {
            keys: Object.keys(input || {}),
            imageLength: input?.image?.length || 'N/A',
            prompt: input?.prompt || 'N/A'
          });
          
          // Validate required inputs
          if (!input || !input.image) {
            throw new Error('Missing required input: image');
          }
          
          if (!input.prompt) {
            throw new Error('Missing required input: prompt');
          }
          
          console.log('Starting replicate.run call...');
          const startTime = Date.now();
          
          // Additional validation for Flux models
          if (model.includes('flux-fill') && !input.mask) {
            console.log('Flux Fill model detected, generating full mask for whole image enhancement');
            // For Flux Fill models, we need a mask. Since we want to enhance the whole image,
            // we'll create a full white mask or let the model handle it
            input.mask = null; // Let the model use the entire image
          }
          
          console.log('Final input being sent to Replicate:', JSON.stringify(input, null, 2));
          
          result = await replicate.run(model, input);
          
          const endTime = Date.now();
          console.log('Replicate.run completed in', endTime - startTime, 'ms');
          console.log('Raw result type:', typeof result);
          console.log('Raw result is array:', Array.isArray(result));
          console.log('Raw result:', JSON.stringify(result, null, 2));
          
          // Process FileOutput objects according to official Replicate docs
          let processedOutput;
          if (Array.isArray(result)) {
            console.log('Processing array result...');
            processedOutput = [];
            for (let i = 0; i < result.length; i++) {
              const item = result[i];
              console.log(`Processing item ${i}:`, typeof item, item);
              
              // Check if it's a FileOutput object with .url() method
              if (item && typeof item === 'object' && typeof item.url === 'function') {
                console.log(`Item ${i} is FileOutput, extracting URL...`);
                const urlString = item.url();
                console.log(`Extracted URL from FileOutput:`, urlString);
                processedOutput.push(urlString);
              } else if (typeof item === 'string') {
                console.log(`Item ${i} is direct string:`, item);
                processedOutput.push(item);
              } else if (item && typeof item === 'object') {
                // Handle plain objects (fallback)
                console.log(`Item ${i} is plain object, keys:`, Object.keys(item));
                if (item.url) {
                  processedOutput.push(item.url);
                } else if (item.image) {
                  processedOutput.push(item.image);
                } else {
                  console.error(`Unknown object structure for item ${i}:`, item);
                  processedOutput.push(item);
                }
              } else {
                console.log(`Item ${i} is unknown type, using as-is:`, item);
                processedOutput.push(item);
              }
            }
          } else {
            console.log('Processing single result...');
            // Handle single result (not array)
            if (result && typeof result === 'object' && typeof result.url === 'function') {
              console.log('Single result is FileOutput, extracting URL...');
              const urlString = result.url();
              console.log('Extracted URL from single FileOutput:', urlString);
              processedOutput = [urlString];
            } else if (typeof result === 'string') {
              console.log('Single result is direct string:', result);
              processedOutput = [result];
            } else {
              console.log('Single result is other type, using as array:', result);
              processedOutput = [result];
            }
          }
          
          console.log('Final processed output:', processedOutput);
          
          // Return in consistent format with processed URLs
          const response = {
            id: `${model.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
            status: 'succeeded',
            output: processedOutput,
            error: null
          };
          
          console.log('Sending response:', JSON.stringify(response, null, 2));
          return res.status(200).json(response);
          
        } catch (runError) {
          console.error('=== REPLICATE.RUN ERROR ===');
          console.error('Error name:', runError?.name);
          console.error('Error message:', runError?.message);
          console.error('Error stack:', runError?.stack);
          console.error('Full error object:', JSON.stringify(runError, null, 2));
          throw runError;
        }
      
      case 'get':
        console.log('Getting prediction status for ID:', input?.id);
        const prediction = await replicate.predictions.get(input.id);
        console.log('Prediction result:', JSON.stringify(prediction, null, 2));
        
        return res.status(200).json({
          id: prediction.id,
          status: prediction.status,
          urls: prediction.urls,
          output: prediction.output,
          error: prediction.error
        });
      
      default:
        console.error('Invalid action:', action);
        return res.status(400).json({ error: 'Invalid action. Use "run" or "get"' });
    }

  } catch (error) {
    console.error('=== MAIN ERROR HANDLER ===');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Try to get more specific error information
    if (error.response) {
      console.error('HTTP Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    if (error.request) {
      console.error('HTTP Request error:', error.request);
    }
    
    const errorResponse = {
      error: 'Replicate API error',
      details: error.message || 'Unknown error occurred',
      message: error.toString(),
      type: error?.constructor?.name || 'Unknown',
      debug: {
        hasResponse: !!error.response,
        hasRequest: !!error.request,
        errorKeys: Object.getOwnPropertyNames(error)
      }
    };
    
    console.log('Sending error response:', JSON.stringify(errorResponse, null, 2));
    console.log('=== REPLICATE API HANDLER END (ERROR) ===');
    
    return res.status(500).json(errorResponse);
  }
}