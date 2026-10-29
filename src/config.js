// Paddle Billing (Paddle.js v2) configuration. Replace the placeholders after creating
// the product/prices in the Paddle dashboard. While any value still starts with its
// placeholder name, all checkout buttons stay disabled.
export const PADDLE = {
  environment: 'production',            // 'sandbox' only for testing with a test_ token
  clientToken: 'live_ffdef85d94a4a9a6faa655ce462', // Developer Tools > Authentication > Client-side tokens (live_...)
  prices: {
    monthly: 'pri_01m64n4s84wk14geqjj5wvkgn5',         // pri_... for US$6 / month
    yearly: 'pri_01m64n7aamdxxbd4x2vnxrh16h',           // pri_... for US$49 / year
  },
};
export const isConfigured = (p = PADDLE) =>
  !!p.clientToken && !/^PADDLE_CLIENT_TOKEN$/.test(p.clientToken) &&
  /^pri_/.test(p.prices.monthly) && /^pri_/.test(p.prices.yearly);
