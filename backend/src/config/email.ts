import { Resend } from "resend";
import { env } from "./env";

// Email is optional: only initialise the Resend client when an API key is set.
// Without it, the app still boots and email-dependent paths degrade gracefully.
export const isEmailEnabled = Boolean(env.RESEND_API_KEY);

export const resend = isEmailEnabled ? new Resend(env.RESEND_API_KEY) : null;
