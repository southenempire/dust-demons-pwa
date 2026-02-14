/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 1. Force Webpack to ensure Solana polyfills work

  webpack: (config) => {
    // 2. Fix the "BigInt" and "Module not found" errors
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // 3. Allow the Jupiter fallback image from GitHub
    config.resolve.fallback = { fs: false, net: false, tls: false };

    return config;
  },

  // 4. Fix the "Image Host" error for the fallback logos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'token.jup.ag',
      },
      {
        protocol: 'https',
        hostname: 'shdw-drive.genesysgo.net',
      },
    ],
  },
};

export default nextConfig;