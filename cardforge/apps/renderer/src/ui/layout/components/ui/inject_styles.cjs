const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'CardFrame.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Inject the constants
const constantsStr = `
        const bPos = badgePositions || {`;

const replacementsConstants = `
        const imgScale = data.imageScale ?? 1;
        const imgOpacity = data.imageOpacity ?? 1;
        const imgBrightness = data.imageBrightness ?? 1;

        const bPos = badgePositions || {`;

content = content.replace(constantsStr, replacementsConstants);

// 2. Replace all style properties for the image
const replacer = (match, p1) => {
    // If it's just backgroundImage
    if (match.includes("}")) {
        return match.replace("}", `, transform: \`scale(\${imgScale})\`, opacity: imgOpacity, filter: \`brightness(\${imgBrightness})\` }`);
    } else {
        return match + `\n                                transform: \`scale(\${imgScale})\`,\n                                opacity: imgOpacity,\n                                filter: \`brightness(\${imgBrightness})\`,`;
    }
};

content = content.replace(/style=\{\{\s*backgroundImage:\s*`url\(\$\{data\.imageUrl\}\)`\s*\}\}/g,
    "style={{ backgroundImage: `url(${data.imageUrl})`, transform: `scale(${imgScale})`, opacity: imgOpacity, filter: `brightness(${imgBrightness})` }}");

content = content.replace(/backgroundImage:\s*`url\(\$\{data\.imageUrl\}\)`\s*,/g,
    "backgroundImage: `url(${data.imageUrl})`,\n                                transform: `scale(${imgScale})`,\n                                opacity: imgOpacity,\n                                filter: `brightness(${imgBrightness})`,");

content = content.replace(/style=\{\{ backgroundImage:\s*`url\('\$\{data\.imageUrl\}'\)`,\s*backgroundSize:\s*'cover',\s*backgroundPosition:\s*'center'\s*\}\}/g,
    "style={{ backgroundImage: `url('${data.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', transform: `scale(${imgScale})`, opacity: imgOpacity, filter: `brightness(${imgBrightness})` }}");

content = content.replace(/<img src=\{data\.imageUrl\} alt="Card Art" className="(.*?)" \/>/g,
    '<img src={data.imageUrl} alt="Card Art" className="$1" style={{ transform: `scale(${imgScale})`, opacity: imgOpacity, filter: `brightness(${imgBrightness})` }} />');

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Replaced successfully!");
