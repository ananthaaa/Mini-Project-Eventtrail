const fs = require('fs');

const path = 'C:\\Users\\caana\\.gemini\\antigravity-ide\\brain\\65601a32-29bd-483e-a1a4-b2ca5c2a6d63\\.system_generated\\steps\\71\\content.md';
const content = fs.readFileSync(path, 'utf8');

// Extract headings
const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
let match;
console.log("=== Headings found ===");
const headings = [];
while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) {
        headings.push(text);
    }
}
headings.slice(0, 40).forEach(h => console.log(`- ${h}`));

console.log("\n=== Checking for specific sections or classes ===");
const sectionCount = (content.match(/<section/g) || []).length;
console.log(`Found ${sectionCount} sections`);

// Let's see if we can find some text strings that tell us about courses
const textMatches = content.match(/[A-Za-z0-9\s,\.!\?\-]{15,100}/g) || [];
console.log(`Found ${textMatches.length} text blocks. Showing a few:`);
textMatches.slice(100, 130).forEach(t => {
    const trimmed = t.trim();
    if (trimmed) console.log(`- ${trimmed}`);
});
