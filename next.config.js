/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // only the packages we still use on the server
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'docx'],
    typedRoutes: true,
  },
};

module.exports = nextConfig;
