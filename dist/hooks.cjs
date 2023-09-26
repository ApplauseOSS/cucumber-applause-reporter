'use strict';

const APPLAUSE_SESSION_ID_ATTACHMENT = 'applause-session-id';
function linkSessionId(sessionId) {
    this.attach(sessionId, {
        fileName: APPLAUSE_SESSION_ID_ATTACHMENT,
        mediaType: 'text/plain',
    });
}

exports.APPLAUSE_SESSION_ID_ATTACHMENT = APPLAUSE_SESSION_ID_ATTACHMENT;
exports.linkSessionId = linkSessionId;
//# sourceMappingURL=hooks.cjs.map
