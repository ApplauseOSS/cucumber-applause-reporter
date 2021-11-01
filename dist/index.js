'use strict';

var cucumber = require('@cucumber/cucumber');
var autoApiClientJs = require('auto-api-client-js');
var messages = require('@cucumber/messages');

class CucumberAutoApiFormatter extends cucumber.Formatter {
    constructor(options) {
        super(options);
        // Maps used to handle data lookup between events.
        // Test Case Storage Handles Storing Information about a TestCase by the TestCaseId
        this.testCaseStorage = {};
        // Test Case Instance Map Maps a TestCaseInstance Id (Single Execution of a TestCase) to the TestCaseId
        this.testCaseInstanceMap = {};
        // Test Instance ResultId Map Holds References to the TestResult creation promise
        this.testCaseInstanceResultIdMap = {};
        // Pickle Map Holds Information about the Gherkin TestCase Information (The actual written out test case)
        this.pickleMap = {};
        // TestResult Status Map keeps track of the status for a TestCaseInstance. If a step fails, the test case fails
        this.testResultStatusMap = {};
        // Extract out any arguments and handle validation
        const apiKey = options.parsedArgvOptions['apiKey'];
        const autoApiUrl = options.parsedArgvOptions['autoApiUrl'];
        this.runName = options.parsedArgvOptions['runName'];
        this.productId = options.parsedArgvOptions['productId'];
        if (apiKey == undefined || apiKey.length <= 0) {
            throw new Error('Invalid Api Key');
        }
        else if (this.runName == undefined || this.runName.length <= 0) {
            throw new Error('Invalid Run Name: ' + this.runName);
        }
        else if (this.productId < 0) {
            throw new Error(`Invalid Product Id: ${this.productId}`);
        }
        else if (autoApiUrl == undefined || autoApiUrl.length <= 0) {
            throw new Error('Invalid URL: ' + autoApiUrl);
        }
        // Setup our Http Client
        this.autoApi = new autoApiClientJs.AutoApi({
            clientConfig: {
                apiKey,
                baseUrl: autoApiUrl,
            },
            productId: this.productId,
            groupingName: this.runName,
        });
        // Add in listener hooks
        this.registerListeners(options.eventBroadcaster);
    }
    /**
     * Registering an event listener to Cucumber's Messaging Api. Only one event will
     * be contained in each envelope
     *
     * @param eventBroadcaster An Event Emitter
     */
    registerListeners(eventBroadcaster) {
        eventBroadcaster.on('envelope', (envelope) => {
            if (envelope.testCase) {
                this.onTestCasePrepared(envelope.testCase);
            }
            else if (envelope.pickle) {
                this.pickleMap[envelope.pickle.id] = envelope.pickle;
            }
            else if (envelope.testCaseStarted) {
                this.onTestCaseStarted(envelope.testCaseStarted);
            }
            else if (envelope.testStepFinished) {
                this.onTestStepFinished(envelope.testStepFinished);
            }
            else if (envelope.testCaseFinished) {
                void this.onTestCaseFinished(envelope.testCaseFinished);
            }
        });
    }
    /**
     * Hook called when a test case is parsed. Used for storing information about a TestCase
     *
     * @param event The Test Case Event
     */
    onTestCasePrepared(event) {
        this.testCaseStorage[event.id] = event;
    }
    /**
     * Hook called when a single instance of a test case is started. Used to register the start of a TestCase
     *
     * @param event The Test Case Started Event
     */
    onTestCaseStarted(event) {
        this.testCaseInstanceMap[event.id] = event.testCaseId;
        const testCase = this.testCaseStorage[event.testCaseId];
        // These messages happen async from the execution of the test cases. That means that we need
        this.testCaseInstanceResultIdMap[event.id] = this.autoApi
            .startTestCase(this.pickleMap[testCase.pickleId].name)
            .then(res => res.data.testResultId);
        this.testResultStatusMap[event.id] = [autoApiClientJs.TestResultStatus.PASSED, undefined];
    }
    /**
     * Hook called when a TestStep is finished. Used to tell if and when a TestCase fails.
     *
     * @param event The Test Step Finished Event
     */
    onTestStepFinished(event) {
        // We already assume that the test case will pass, so if it did, just move on
        if (event.testStepResult.status == messages.TestStepResultStatus.PASSED) {
            return;
        }
        const currentStatus = this.testResultStatusMap[event.testCaseStartedId][0];
        // If the current result already has a status set, don't override it
        if (currentStatus != autoApiClientJs.TestResultStatus.PASSED) {
            return;
        }
        // Get the test case ID
        const testCaseId = this.testCaseInstanceMap[event.testCaseStartedId];
        // Lookup the TestCase
        const testCase = this.testCaseStorage[testCaseId];
        // Look for the TestStep that was executed
        const testStepOptions = testCase.testSteps.filter(s => s?.id == event.testStepId);
        if (testStepOptions && testStepOptions.length != 1) {
            throw new Error('Could not find test step within the test case');
        }
        // Now that we have the test step, lets look it up in the pickle to get the actual step text
        const pickle = this.pickleMap[testCase.pickleId];
        const pickleStepId = testStepOptions[0].pickleStepId;
        const pickleStep = pickle.steps.filter(step => step.id == pickleStepId)[0];
        // Map the step status to a result status
        let result;
        switch (event.testStepResult.status) {
            case messages.TestStepResultStatus.FAILED:
                result = [
                    autoApiClientJs.TestResultStatus.FAILED,
                    'Test Failed at Step: ' + pickleStep.text,
                ];
                break;
            case messages.TestStepResultStatus.AMBIGUOUS:
                result = [
                    autoApiClientJs.TestResultStatus.ERROR,
                    'Ambiguous Test Step Status at Step: ' + pickleStep.text,
                ];
                break;
            case messages.TestStepResultStatus.PENDING:
                result = [
                    autoApiClientJs.TestResultStatus.ERROR,
                    'Pending TestStep Status at Step: ' + pickleStep.text,
                ];
                break;
            case messages.TestStepResultStatus.SKIPPED:
                result = [
                    autoApiClientJs.TestResultStatus.SKIPPED,
                    'Test Skipped at Step: ' + pickleStep.text,
                ];
                break;
            case messages.TestStepResultStatus.UNDEFINED:
                result = [
                    autoApiClientJs.TestResultStatus.ERROR,
                    'Undefined Test Step Status at Step: ' + pickleStep.text,
                ];
                break;
            case messages.TestStepResultStatus.UNKNOWN:
                result = [
                    autoApiClientJs.TestResultStatus.FAILED,
                    'Unknown Test Step Status at Step: ' + pickleStep.text,
                ];
                break;
        }
        // Finally, save off the updated statuses
        this.testResultStatusMap[event.testCaseStartedId] = result;
    }
    /**
     * Hook called when a TestCase finishes it's execution. USed to submit test results to AutoApi
     *
     * @param event The TestCaseFinished event
     */
    async onTestCaseFinished(event) {
        // Wait for the test result to be created before starting the result submission
        const resultId = await this.testCaseInstanceResultIdMap[event.testCaseStartedId];
        // Pull the TestResults from the TestResultStatusMap
        const [status, failure] = this.testResultStatusMap[event.testCaseStartedId];
        // Finally, submit the TestResult
        void (await this.autoApi.submitTestResult(resultId, status || autoApiClientJs.TestResultStatus.PASSED, failure));
    }
}

module.exports = CucumberAutoApiFormatter;
//# sourceMappingURL=index.js.map
