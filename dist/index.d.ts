import { IWorld, Formatter, IFormatterOptions } from '@cucumber/cucumber';
import { EventEmitter } from 'events';
import { TestCaseStarted, TestStepFinished, TestCaseFinished } from '@cucumber/messages';

declare const APPLAUSE_SESSION_ID_ATTACHMENT = "applause-session-id";
declare function linkSessionId(this: IWorld<any>, sessionId: string): void;

declare class CucumberAutoApiFormatter extends Formatter {
    private reporter;
    private testCaseStorage;
    private testCaseInstanceMap;
    private testCaseInstanceSessionMap;
    private pickleMap;
    private testResultStatusMap;
    private readonly REMOVE_CONTROL_CHARS;
    private readonly REMOVE_ANSI_CHARACTERS;
    constructor(options: IFormatterOptions);
    /**
     * Registering an event listener to Cucumber's Messaging Api. Only one event will
     * be contained in each envelope
     *
     * @param eventBroadcaster An Event Emitter
     */
    registerListeners(eventBroadcaster: EventEmitter): void;
    /**
     * Hook called when a single instance of a test case is started. Used to register the start of a TestCase
     *
     * @param event The Test Case Started Event
     */
    onTestCaseStarted(event: TestCaseStarted): void;
    /**
     * Hook called when a TestStep is finished. Used to tell if and when a TestCase fails.
     *
     * @param event The Test Step Finished Event
     */
    onTestStepFinished(event: TestStepFinished): void;
    /**
     * Hook called when a TestCase finishes it's execution. USed to submit test results to AutoApi
     *
     * @param event The TestCaseFinished event
     */
    onTestCaseFinished(event: TestCaseFinished): void;
    private cleanCucumberMessage;
}

export { APPLAUSE_SESSION_ID_ATTACHMENT, CucumberAutoApiFormatter as default, linkSessionId };
