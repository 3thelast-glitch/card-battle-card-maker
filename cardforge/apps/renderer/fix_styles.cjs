const fs = require('fs');
const file = 'a:/card-battle-card-maker/cardforge/apps/renderer/src/styles.css';
let content = fs.readFileSync(file, 'utf8');

const target = '.animate-glitch-tear {\r\n  animation: glitchTear 2s infinite alternate;\r\n}';
const target2 = '.animate-glitch-tear {\n  animation: glitchTear 2s infinite alternate;\n}';

let idx = content.indexOf(target);
let len = target.length;

if (idx === -1) {
    idx = content.indexOf(target2);
    len = target2.length;
}

if (idx !== -1) {
    const newContent = content.substring(0, idx + len) + `

/* --- Phase 12: Swamp Layout Animations --- */

@keyframes bubbleRise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.8; }
  80% { opacity: 0.5; }
  100% { transform: translateY(-520px) scale(0.5); opacity: 0; }
}

@keyframes rippleExpand {
  0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0.8; }
  100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
}

@keyframes weedSway {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg); }
}

@keyframes waveShift {
  0% { transform: translateX(-8px); }
  100% { transform: translateX(8px); }
}

@keyframes swampSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.swamp-card-frame {
  box-shadow: 0 50px 120px rgba(0,150,60,0.55), 0 0 0 1px rgba(0,100,40,0.4), inset 0 0 100px rgba(0,0,0,0.85);
}
`;
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed styles.css');
} else {
    console.log('Could not find target string in styles.css. Length:', content.length);
}
