/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tesseract.js needs resolve fallback; Turbopack may not need it
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) return config;
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
