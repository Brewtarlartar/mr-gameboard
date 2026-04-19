/**
 * Gemini API Connection Test Script
 * 
 * Run this to verify your GEMINI_API_KEY is working:
 * node scripts/test-gemini.js
 */

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('🔮 GEMINI API CONNECTION TEST');
console.log('========================================\n');

// Step 1: Load environment variables manually (no dotenv dependency)
console.log('Step 1: Loading environment variables...');

let API_KEY = process.env.GEMINI_API_KEY;

// If not in process.env, try to read from .env.local
if (!API_KEY) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/GEMINI_API_KEY=(.+)/);
      if (match) {
        API_KEY = match[1].trim();
        console.log('✅ Loaded API key from .env.local');
      }
    }
  } catch (err) {
    console.log('⚠️  Could not read .env.local:', err.message);
  }
}
// Step 2: Check if API key exists
console.log('\nStep 2: Checking API Key...');
if (!API_KEY) {
  console.error('❌ FAILED: GEMINI_API_KEY not found in environment variables or .env.local');
  console.error('   Please add: GEMINI_API_KEY=your_key_here to .env.local');
  console.error('   Get a key at: https://aistudio.google.com/app/apikey');
  process.exit(1);
}
console.log(`✅ API Key found: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);

// Step 3: Initialize the client
console.log('\nStep 3: Initializing Google AI client...');
const genAI = new GoogleGenerativeAI(API_KEY);
console.log('✅ Client initialized');

// Step 4: Test with a simple message
async function testConnection() {
  try {
    console.log('\nStep 4: Sending test message to gemini-2.5-flash...');
    
    // First, let's see what models are available
    try {
      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro',
        'gemini-pro-latest',
      ];
      
      let workingModel = null;
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`   Testing model: ${modelName}...`);
          const model = genAI.getGenerativeModel({
            model: modelName,
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 256,
            },
          });

          const chat = model.startChat({ history: [] });
          
          console.log(`      📤 Sending test message...`);
          const result = await chat.sendMessage('Hello, this is a connection test. Reply with OK.');
          const response = result.response;

          // Check for safety blocks
          if (response.promptFeedback?.blockReason) {
            console.log(`      ⚠️  Model ${modelName} blocked the message`);
            continue;
          }

          const candidate = response.candidates?.[0];
          if (candidate?.finishReason === 'SAFETY') {
            console.log(`      ⚠️  Model ${modelName} blocked the response`);
            continue;
          }

          const text = response.text();
          console.log(`      ✅ Model ${modelName} works! Response: "${text.substring(0, 50)}..."`);
          workingModel = modelName;
          break;
        } catch (err) {
          console.log(`      ❌ Model ${modelName} failed:`, err.message.split('\n')[0].substring(0, 80));
          continue;
        }
      }
      
      if (!workingModel) {
        throw new Error('None of the tested models are available. Your API key may be invalid or restricted.');
      }
      
      console.log(`\n✅ SUCCESS: Gemini API is working correctly!`);
      console.log(`   Working Model: ${workingModel}`);
      console.log('\n========================================');
      console.log('Your API key is valid and the connection is working.');
      console.log(`lib/gemini.ts should use: MODEL_NAME = '${workingModel}'`);
      console.log('========================================\n');
      
    } catch (err) {
      throw err;
    }

  } catch (error) {
    console.error('\n❌ FAILED: Connection test failed');
    console.error('\n📋 ERROR DETAILS:');
    console.error('   Name:', error.name);
    console.error('   Message:', error.message);
    
    // Parse common errors
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
      console.error('\n🔑 DIAGNOSIS: API Key Invalid');
      console.error('   Solution: Check your GEMINI_API_KEY in .env.local');
      console.error('   Get a key at: https://aistudio.google.com/app/apikey');
    } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate')) {
      console.error('\n⏳ DIAGNOSIS: Rate Limit / Quota Exceeded');
      console.error('   Solution: Wait a moment or upgrade your API plan');
    } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      console.error('\n🔍 DIAGNOSIS: Model Not Found');
      console.error('   Solution: Check if gemini-1.5-flash is available in your region');
    } else if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
      console.error('\n🛡️ DIAGNOSIS: Safety Filter Triggered');
      console.error('   Solution: Safety settings are already set to BLOCK_NONE');
      console.error('   This should not happen with "Hello" - check Google AI Studio');
    } else {
      console.error('\n❓ DIAGNOSIS: Unknown Error');
      console.error('   Full error:', error);
    }
    
    console.error('\n========================================\n');
    process.exit(1);
  }
}

// Run the test
testConnection();

