/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // keep these out of the client/edge bundle
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'pdfkit', 'fontkit', 'iconv-lite'],
    typedRoutes: true,
  },
};

module.exports = nextConfig;