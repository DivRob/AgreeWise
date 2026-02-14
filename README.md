# AgreeWise 

## Basic Details
**Team Name:** DeCode

**Team Members**
* **Member 1:** Divya Robin - RIT Kottayam
* **Member 2:** Gaurinandana S - RIT Kottayam

**Hosted Project Link**
(https://github.com/DivRob/AgreeWise.git)

## Project Description
AgreeWise is a Chrome extension intended to clarify complicated legal language present in Terms of Service and License Agreements. Utilizing AI, it quickly analyzes legal documents to deliver users a straightforward, understandable summary of their actual agreement.

## The Problem Statement
> Most internet users "Accept" terms and conditions without reading them because they are intentionally long, dense, and filled with legalese. This leads to users unknowingly consenting to invasive data collection, hidden fees, or waiving their legal rights.

## The Solution
AgreeWise solves this by extracting the text from any active webpage and passing it to the Gemini AI model. The extension categorizes clauses into Red, Yellow, and Green flags, allowing users to make an informed decision in seconds rather than hours.

---

## Technical Details

### Technologies/Components Used
**For Software:**
* **Languages used:** JavaScript, HTML, CSS
* **Frameworks used:** Chrome Extension Manifest V3
* **Libraries used:** Google Gemini API (Generative AI)
* **Tools used:** VS Code, Git

### Features
* **One-Click Analysis:** Instantly scrapes and analyzes the active tab's text.
* **Risk Categorization:** Uses a color-coded system (Red/Yellow/Green) to highlight risky vs. fair clauses.
* **AI-Powered Summarization:** Provides a 1-sentence "Verdict" for rapid assessment.
* **Smart Search Box:** Allows users to filter through the summary for specific terms like "data," "billing," or "termination."
* **Contextual UI:** Features a sleek, modern popup with interactive loading states.

---

## Implementation

### Installation
1. Clone the repository:
```bash
git clone https://github.com/DivRob/AgreeWise.git
```
2. Navigate to chrome://extensions/ in your browser.
3. Enable Developer Mode in the top right.
4. Click Load Unpacked and select the project folder.



### Run
1. Navigate to any website's "Terms of Service" or "Privacy Policy" page.
2. Click the AgreeWise icon in your extension toolbar.
3. Click Analyze Terms.
4. Use the Search Bar to filter results instantly.

---

## Project Documentation


### Screenshots


### System Architecture:
The extension follows the Manifest V3 architecture. The Popup (UI) communicates with the Content Script (Scraper) via message passing (chrome.tabs.sendMessage). Once the text is retrieved, the Popup makes a direct REST API call to the Gemini 3 Flash model using a secure API key stored in config.js.

---

### API Documentation
