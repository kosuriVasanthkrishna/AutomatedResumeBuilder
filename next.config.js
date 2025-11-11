/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // only the packages we still use on the server
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'docx'],
    typedRoutes: true,
  },
  // Ensure environment variables are loaded
  env: {
    // This ensures env vars are available at build time
    // Note: .env.local should be auto-loaded, but this helps with some edge cases
  },
};

module.exports = nextConfig;
