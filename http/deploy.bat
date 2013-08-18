@echo off
cd dist
git add -A
git commit -a -m "update"
git push
cd ..
