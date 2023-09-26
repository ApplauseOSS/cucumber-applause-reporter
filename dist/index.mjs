import { Formatter } from '@cucumber/cucumber';
import { loadConfig, ApplauseReporter, TestResultStatus } from 'applause-reporter-common';
import { TestStepResultStatus } from '@cucumber/messages';

const APPLAUSE_SESSION_ID_ATTACHMENT = 'applause-session-id';
function linkSessionId(sessionId) {
    this.attach(sessionId, {
        fileName: APPLAUSE_SESSION_ID_ATTACHMENT,
        mediaType: 'text/plain',
    });
}

class CucumberAutoApiFormatter extends Formatter {
    constructor(options) {
        super(options);
        // Maps used to handle data lookup between events.
        // Test Case Storage Handles Storing Information about a TestCase by the TestCaseId
        this.testCaseStorage = {};
        // Test Case Instance Map Maps a TestCaseInstance Id (Single Execution of a TestCase) to the TestCaseId
        this.testCaseInstanceMap = {};
        this.testCaseInstanceSessionMap = {};
        // Pickle Map Holds Information about the Gherkin TestCase Information (The actual written out test case)
        this.pickleMap = {};
        // TestResult Status Map keeps track of the status for a TestCaseInstance. If a step fails, the test case fails
        this.testResultStatusMap = {};
        this.REMOVE_CONTROL_CHARS = new RegExp(
        /* eslint-disable-next-line no-control-regex */
        /[^\x00-\x7F]/gm);
        this.REMOVE_ANSI_CHARACTERS = new RegExp(
        /* eslint-disable-next-line no-control-regex */
        [
            '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
            '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
        ].join('|'), 'gm');
        console.log('CDP is: ' + process.cwd());
        const config = loadConfig({
            configFile: 'applause.json',
            properties: {
                apiKey: options.parsedArgvOptions['apiKey'],
                baseUrl: options.parsedArgvOptions['autoApiUrl'],
                productId: options.parsedArgvOptions['productId'],
                testRailOptions: (options.parsedArgvOptions['testRailOptions']),
                applauseTestCycleId: (options.parsedArgvOptions['applauseTestCycleId']),
            },
        });
        // Setup our Http Client
        this.reporter = new ApplauseReporter(config);
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
            if (envelope.gherkinDocument) {
                envelope.gherkinDocument.feature?.children.map(child => child.scenario?.name);
            }
            if (envelope.testRunStarted) {
                this.reporter.runnerStart(Object.values(this.testCaseStorage).map(testCase => this.pickleMap[testCase.pickleId].name));
            }
            else if (envelope.attachment) {
                if (envelope.attachment.fileName == APPLAUSE_SESSION_ID_ATTACHMENT) {
                    const testCaseStartedId = envelope.attachment.testCaseStartedId;
                    if (testCaseStartedId === undefined) {
                        return;
                    }
                    const existingSessions = this.testCaseInstanceSessionMap[testCaseStartedId] || [];
                    this.testCaseInstanceSessionMap[testCaseStartedId] = [
                        ...existingSessions,
                        envelope.attachment.body,
                    ];
                }
            }
            else if (envelope.testCase) {
                this.testCaseStorage[envelope.testCase.id] = envelope.testCase;
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
            else if (envelope.testRunFinished) {
                void this.reporter.runnerEnd();
            }
        });
    }
    /**
     * Hook called when a single instance of a test case is started. Used to register the start of a TestCase
     *
     * @param event The Test Case Started Event
     */
    onTestCaseStarted(event) {
        this.testCaseInstanceMap[event.id] = event.testCaseId;
        const testCase = this.testCaseStorage[event.testCaseId];
        this.reporter.startTestCase(testCase.id, this.pickleMap[testCase.pickleId].name, { providerSessionIds: this.testCaseInstanceSessionMap[event.id] || [] });
        this.testResultStatusMap[event.id] = [TestResultStatus.PASSED, undefined];
    }
    /**
     * Hook called when a TestStep is finished. Used to tell if and when a TestCase fails.
     *
     * @param event The Test Step Finished Event
     */
    onTestStepFinished(event) {
        // We already assume that the test case will pass, so if it did, just move on
        if (event.testStepResult.status == TestStepResultStatus.PASSED) {
            return;
        }
        const currentStatus = this.testResultStatusMap[event.testCaseStartedId][0];
        // If the current result already has a status set, don't override it
        if (currentStatus != TestResultStatus.PASSED) {
            return;
        }
        // Get the test case ID
        const testCaseId = this.testCaseInstanceMap[event.testCaseStartedId];
        // Lookup the TestCase
        const testCase = this.testCaseStorage[testCaseId];
        // Look for the TestStep that was executed
        const testStepOptions = testCase.testSteps.filter(s => s.id == event.testStepId);
        if (testStepOptions && testStepOptions.length != 1) {
            throw new Error('Could not find test step within the test case');
        }
        // Now that we have the test step, lets look it up in the pickle to get the actual step text
        const pickle = this.pickleMap[testCase.pickleId];
        const pickleStepId = testStepOptions[0].pickleStepId;
        const pickleSteps = pickle ? pickle.steps : [];
        const pickleStep = pickleSteps.filter(step => step.id == pickleStepId)[0];
        const stepText = pickleStep
            ? pickleStep.text
            : undefined;
        // Map the step status to a result status
        let status;
        switch (event.testStepResult.status) {
            case TestStepResultStatus.FAILED:
                status = TestResultStatus.FAILED;
                break;
            case TestStepResultStatus.AMBIGUOUS:
                status = TestResultStatus.ERROR;
                break;
            case TestStepResultStatus.PENDING:
                status = TestResultStatus.ERROR;
                break;
            case TestStepResultStatus.SKIPPED:
                status = TestResultStatus.SKIPPED;
                break;
            case TestStepResultStatus.UNDEFINED:
                status = TestResultStatus.ERROR;
                break;
            case TestStepResultStatus.UNKNOWN:
                status = TestResultStatus.FAILED;
                break;
        }
        const cucumberMessage = this.cleanCucumberMessage(event.testStepResult.message || 'Unknown');
        let errorMessage;
        if (stepText != undefined) {
            errorMessage = `${event.testStepResult.status} Test Step: ${stepText}. Reason: ${cucumberMessage}`;
        }
        else {
            errorMessage = `Test Case ${event.testStepResult.status} at Unknown Step. Reason: ${cucumberMessage}`;
        }
        // Finally, save off the updated statuses
        this.testResultStatusMap[event.testCaseStartedId] = [status, errorMessage];
    }
    /**
     * Hook called when a TestCase finishes it's execution. USed to submit test results to AutoApi
     *
     * @param event The TestCaseFinished event
     */
    onTestCaseFinished(event) {
        // Pull the TestResults from the TestResultStatusMap
        const [status, failure] = this.testResultStatusMap[event.testCaseStartedId];
        const testCaseId = this.testCaseInstanceMap[event.testCaseStartedId];
        // Finally, submit the TestResult
        this.reporter.submitTestCaseResult(testCaseId, status || TestResultStatus.PASSED, {
            failureReason: failure,
            providerSessionGuids: this.testCaseInstanceSessionMap[event.testCaseStartedId] || [],
        });
    }
    cleanCucumberMessage(message) {
        return message
            .replace(this.REMOVE_ANSI_CHARACTERS, '')
            .replace(this.REMOVE_CONTROL_CHARS, '');
    }
}

export { APPLAUSE_SESSION_ID_ATTACHMENT, CucumberAutoApiFormatter as default, linkSessionId };
//# sourceMappingURL=index.mjs.map
