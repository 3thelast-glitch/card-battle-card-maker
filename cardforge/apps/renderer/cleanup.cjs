const fs = require('fs');
const path = require('path');

const cardFramePath = path.join(__dirname, 'src', 'ui', 'layout', 'components', 'ui', 'CardFrame.tsx');
let content = fs.readFileSync(cardFramePath, 'utf8');

// The glitch layout starts with "if (layout === 'glitch-artifact') {" and ends before "if (layout === 'full-bleed') {"
const glitchStart = "if (layout === 'glitch-artifact') {";
const fullBleedStart = "if (layout === 'full-bleed') {";

const firstGlitchIndex = content.indexOf(glitchStart);
if (firstGlitchIndex !== -1) {
    // Find the LAST full-bleed start because each insertion added a full-bleed start!
    const lastFullBleedIndex = content.lastIndexOf(fullBleedStart);

    // We want to keep exactly one glitch block and exactly one full-bleed block.
    // The easiest way is to extract ONE glitch block.
    const oneGlitchBlockLength = content.indexOf(fullBleedStart, firstGlitchIndex) - firstGlitchIndex;
    const oneGlitchBlock = content.substring(firstGlitchIndex, firstGlitchIndex + oneGlitchBlockLength);

    // Now we reconstruct the file:
    // 1. Everything before the first glitch block
    // 2. ONE glitch block
    // 3. Everything from the LAST full-bleed block onwards

    const beforePart = content.substring(0, firstGlitchIndex);
    const afterPart = content.substring(lastFullBleedIndex);

    content = beforePart + RegExp('\\n').exec(oneGlitchBlock) ? oneGlitchBlock + '\\n        ' + afterPart : oneGlitchBlock + '\\n        ' + afterPart;
    // Actually the glitch block includes the indentation. Let's just do:
    content = beforePart + oneGlitchBlock + '\\n        ' + afterPart;
    fs.writeFileSync(cardFramePath, content, 'utf8');
    console.log('Fixed duplications!');
}

