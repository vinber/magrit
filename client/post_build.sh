echo "Replacing files in /magrit_app/static/dist/ folder..."
mkdir -p ../magrit_app/static/dist
rm -rf ../magrit_app/static/dist/*.js
cp dist/*.js ../magrit_app/static/dist/
cp css/style-fonts.css ../magrit_app/static/dist/style-fonts.css
cp js/webworker* ../magrit_app/static/dist/
cp dist/html/modules.html ../magrit_app/static/
cp html/contact_form.html ../magrit_app/static/
cp html/index.html ../magrit_app/static/
cp html/page404.html ../magrit_app/static/
