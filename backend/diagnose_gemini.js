require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ Error: GEMINI_API_KEY is not set in backend/.env file.');
  process.exit(1);
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log(`[Diagnostic] Querying Gemini models list...`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (Status ${response.status}):`, errorText);
      return;
    }
    
    const data = await response.json();
    console.log(`\n✅ Successfully connected to Gemini API!`);
    console.log(`Available Models for your API key:`);
    console.log(`-----------------------------------`);
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        // Only print models that support generateContent method
        const supportsGenerate = model.supportedGenerationMethods.includes('generateContent');
        console.log(`- ${model.name.replace('models/', '')} ${supportsGenerate ? '(Supports Text Generation)' : ''}`);
      });
    } else {
      console.log('No models returned. Output structure:', JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Fetch failed:', error.message);
  }
}

listModels();
