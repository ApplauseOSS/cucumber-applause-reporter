import { IWorld } from '@cucumber/cucumber';

export const APPLAUSE_SESSION_ID_ATTACHMENT = 'applause-session-id';

export function linkSessionId(this: IWorld<any>, sessionId: string) {
  this.attach(sessionId, {
    fileName: APPLAUSE_SESSION_ID_ATTACHMENT,
    mediaType: 'text/plain',
  });
}
