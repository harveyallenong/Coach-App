/**
 * SMTP connection URL. A URL (not an options object) is used on purpose: Auth.js
 * deep-merges an options object with a default `auth: { user: "", pass: "" }`,
 * which makes Nodemailer fail with "Missing credentials" on servers without auth.
 */
export function smtpUrl(opts: { host: string; port: number; user?: string; password?: string }) {
  const protocol = opts.port === 465 ? "smtps" : "smtp";
  const credentials = opts.user
    ? `${encodeURIComponent(opts.user)}:${encodeURIComponent(opts.password ?? "")}@`
    : "";
  return `${protocol}://${credentials}${opts.host}:${opts.port}`;
}
