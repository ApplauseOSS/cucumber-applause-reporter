rm yarn.lock
rm -rf node_modules/**/*
yarn install
yarn lint
yarn build
yarn test