echo "Replacing files in /magrit_app/static/dist/ folder..."
mkdir -p ../magrit_app/static/dist
rm -rf ../magrit_app/static/dist/app.js
cp dist/app.js ../magrit_app/static/dist/app.js
cp css/style-fonts.css ../magrit_app/static/dist/style-fonts.css
cp js/webworker* ../magrit_app/static/dist/
