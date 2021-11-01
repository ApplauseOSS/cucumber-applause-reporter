module.exports = {
    default: [
        `--format-options '{"snippetInterface": "synchronous", "autoApiUrl": "https://integration-auto-api.devcloud.applause.com:443/", "productId": 51, "apiKey": "43792e3b-e601-4593-a4c9-0457d04c0c260dc526", "runName": "Test 2"}'`,
        ` -f ./src/reporter.ts`,
        '--require test/features/**/*.ts',
        `--require-module ts-node/register`
    ].join(' ')
}