const fs = require('fs');
const file = 'a:/card-battle-card-maker/cardforge/apps/renderer/src/ui/layout/components/ui/CardFrame.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.splice(1855, 1054);
fs.writeFileSync(file, lines.join('\n'));
console.log('Duplicated lines removed');
