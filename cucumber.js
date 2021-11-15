module.exports = {
    default: [
        // `--format-options '{"snippetInterface": "synchronous", "autoApiUrl": "", "productId": 0, "apiKey": "", "runName": ""}'`,
        // ` -f ./src/reporter.ts`,
        '--require test/features/**/*.ts',
        `--require-module ts-node/register`
    ].join(' ')
}