# 🔥 COMPLETE FIX-ALL-ERRORS.PS1 - PowerShell Script for CardForge Renderer
# Save as: A:\card-battle-card-maker\cardforge\apps\renderer\fix-all-errors.ps1
# Run: .\fix-all-errors.ps1

Write-Host "🔧 Fixing 40+ TypeScript errors in CardForge Renderer..." -ForegroundColor Green

# 1. CLEANUP
Write-Host "`n🧹 Step 1: Cleanup..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm cache clean --force

# 2. INSTALL MISSING PACKAGES & TYPES
Write-Host "`n📦 Step 2: Install missing packages..." -ForegroundColor Yellow
npm install --save-exact react-resizable-panels@latest react-draggable@^4.4
