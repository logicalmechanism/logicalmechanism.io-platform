cd apps
rm -fr explorer || true
cd ../explorer-app
npm run build
cp -r build ../apps/explorer