const setupView = document.getElementById('setup-view');
const loader = document.getElementById('loader');
const resultsView = document.getElementById('results-view');
const analyzeBtn = document.getElementById('analyze-btn');

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
    // 🛑 REPLACE THIS WITH YOUR REAL API KEY done
    const API_KEY = CONFIG.GEMINI_API_KEY; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;    // We truncate the text to ~15k characters so the AI doesn't get overwhelmed 
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