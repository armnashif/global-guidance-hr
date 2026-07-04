// Vercel's Hono framework detector accepts src/index.ts as an entrypoint.
// The application remains implemented in app.tsx because Vite uses its raw
// HTML imports and existing Cloudflare build configuration from that module.
export { default } from './app'
