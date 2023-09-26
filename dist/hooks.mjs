const APPLAUSE_SESSION_ID_ATTACHMENT = 'applause-session-id';
function linkSessionId(sessionId) {
    this.attach(sessionId, {
        fileName: APPLAUSE_SESSION_ID_ATTACHMENT,
        mediaType: 'text/plain',
    });
}

export { APPLAUSE_SESSION_ID_ATTACHMENT, linkSessionId };
//# sourceMappingURL=hooks.mjs.map
