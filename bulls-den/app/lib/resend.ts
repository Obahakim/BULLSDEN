import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resendConfigured = Boolean(apiKey);

// Lazily constructed so a missing key doesn't crash the module on import.
export const resend = apiKey ? new Resend(apiKey) : null;

// Resend's sandbox "from" address works without a verified domain — swap this
// for something like "Bull's Den <noreply@yourdomain.com>" once you verify a
// domain in the Resend dashboard.
export const EMAIL_FROM = process.env.RESEND_FROM || "Bull's Den <onboarding@resend.dev>";