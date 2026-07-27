const fs = require('fs');
const path = 'C:\\Users\\caana\\.gemini\\antigravity-ide\\brain\\65601a32-29bd-483e-a1a4-b2ca5c2a6d63\\.system_generated\\steps\\71\\content.md';
const content = fs.readFileSync(path, 'utf8');

console.log("Total length:", content.length);
console.log("Ends with:", content.substring(content.length - 500));

const bodyIndex = content.indexOf('<body');
if (bodyIndex !== -1) {
    console.log("Body starts at:", bodyIndex);
    console.log("Body content snippet (1000 chars):", content.substring(bodyIndex, bodyIndex + 2000));
} else {
    console.log("No body tag found!");
}
