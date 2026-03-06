@echo off
echo Pushing updates to GitHub...
git add .
git commit -m "Update from Smart Pantry"
git push origin main
echo Done!
pause
