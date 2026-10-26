/** The CSRF `state` of the Constant Contact OAuth flow, shared by ./connect and ./callback. */
export const OAUTH_STATE_COOKIE = "cc_oauth_state";

/** Long enough to sign in to Constant Contact first; its authorization codes last 5 minutes. */
export const OAUTH_STATE_MAX_AGE_SECONDS = 15 * 60;
