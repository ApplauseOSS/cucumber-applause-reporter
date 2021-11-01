# auto-reporter-cucumber-js
Applause Automation Reporter for CucumberJS

Written in TypeScript, transpiled to JS for NPM packaging using Rollup

creates NPM package in /dist folder in ES, UMD, and CJS module formats

also publishes Typescript types and sourcemaps into NPM package

runs tests using Node and Cucumber

Configured for Node 12+ . To update, change base tsconfig from "extends": "@tsconfig/node12/tsconfig.json", update "engines" section in package.json, and update .node-version file

## Setup

`yarn install`

### build

`yarn build`

### test

`yarn test`

### clean

`yarn clean`

### lint

`yarn lint`

## Publishing

TODO

## Usage
To use this reporter in your cucumber tests, include the following line in your cucumber.js configuration: ` -f ./src/reporter.ts`