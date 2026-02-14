const setupView = document.getElementById('setup-view');
const loader = document.getElementById('loader');
const resultsView = document.getElementById('results-view');
const analyzeBtn = document.getElementById('analyze-btn');
let capturedLegalText = "";

document.addEventListener('DOMContentLoaded', () => {
    // Now these functions can see the variables above
    analyzeBtn.addEventListener('click', async () => {
        setupView.classList.add('hidden');
        loader.classList.remove('hidden');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we are on a valid page (not chrome:// or a blank tab)
            if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
                alert("Please open a standard website first.");
                resetUI();
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: "getText" }, async (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Connection error:", chrome.runtime.lastError.message);
                    alert("Please refresh the webpage and try again.");
                    resetUI();
                    return;
                }

                if (response && response.text) {
                    await processWithAI(response.text);
                }
            });
        } catch (err) {
            console.error(err);
            resetUI();
        }
    });
});

// 2. This function can now "see" setupView and loader because they are global
function resetUI() {
    loader.classList.add('hidden');
    resultsView.classList.add('hidden');
    setupView.classList.remove('hidden');
}

async function processWithAI(legalText) {
    capturedLegalText = legalText;
    // 🛑 REPLACE THIS WITH YOUR REAL API KEY done
    const API_KEY = CONFIG.GEMINI_API_KEY; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;    // We truncate the text to ~15k characters so the AI doesn't get overwhelmed 
    // and to stay within free tier limits.
    const truncatedText = legalText.substring(0, 15000);

    // Prompt
    const prompt = `Analyze this legal text and identify:
    - RED FLAGS: Highly risky clauses (data selling, no lawsuits, hidden fees).
    - YELLOW FLAGS: Concerning clauses (auto-renewals, tracking, data sharing).
    - GREEN FLAGS: Fair clauses (clear deletion policy, user owns data).
    
    Return ONLY a JSON object:
    {"verdict": "1-sentence summary", "red": ["..."], "yellow": ["..."], "green": ["..."]}

    TEXT: ${legalText.substring(0, 15000)}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // The AI sometimes adds markdown like ```json ... ```, so we strip it
        let rawContent = data.candidates[0].content.parts[0].text;
        const cleanJson = rawContent.replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanJson);

        displayResults(result);

    } catch (error) {
        console.error("AI Error:", error);
        alert("The AI had a hiccup. Check your API key or the console.");
        resetUI();
    }
}

function displayResults(data) {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('results-view').classList.remove('hidden');
    document.getElementById('verdict-text').innerText = data.verdict;

    const fillList = (listId, containerId, items) => {
        const list = document.getElementById(listId);
        const container = document.getElementById(containerId);
        list.innerHTML = ''; 
        if (items && items.length > 0) {
            container.classList.remove('hidden');
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerText = item;
                list.appendChild(li);
            });
        }
    };

    fillList('red-list', 'red-container', data.red);
    fillList('yellow-list', 'yellow-container', data.yellow);
    fillList('green-list', 'green-container', data.green);
}

document.getElementById('ask-btn').addEventListener('click', async () => {
    const question = document.getElementById('user-question').value;
    const output = document.getElementById('answer-output');
    const askBtn = document.getElementById('ask-btn');
    
    // 1. Critical Check: Ensure we have the text and a question
    if (!question || !capturedLegalText) {
        output.textContent = "Please scan a page first!";
        return;
    }

    output.classList.remove('hidden');
    askBtn.disabled = true; // Prevent double-clicking
    askBtn.style.opacity = "0.5";
    
    // Add the spinner and text
    output.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div class="spinner" style="width: 12px; height: 12px; border-width: 2px; margin: 0;"></div>
            <span>Analyzing the fine print...</span>
        </div>
    `;

    try {
        const API_KEY = CONFIG.GEMINI_API_KEY; 
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

        // 2. Use the correct global variable: capturedLegalText
        const chatPrompt = `
          You are a helpful legal assistant. Answer the user's question based ONLY on the provided text. 
          If the answer isn't there, say "The agreement does not explicitly mention this."
          Keep the answer concise (max 3 sentences).

          User Question: ${question}
          
          Agreement Text: ${capturedLegalText.substring(0, 20000)} 
        `;

        // 3. Use FETCH to match your other function's style
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: chatPrompt }] }]
            })
        });

        const result = await response.json();

        try {
            // Navigating the Gemini API response structure
            const aiText = result.candidates[0].content.parts[0].text;
            
            const output = document.getElementById('answer-output');
            output.classList.remove('hidden');
            output.innerHTML = `<strong>AI Answer:</strong> ${aiText}`;
        } catch (e) {
            console.error("Parsing error:", e);
            document.getElementById('answer-output').innerText = "The AI gave an unexpected response format.";
        }

    } catch (error) {
        output.textContent = "Error finding answer. Try again.";
        console.error("Chat Error:", error);
    } finally {
        askBtn.disabled = false;
        askBtn.style.opacity = "1";
    }
});