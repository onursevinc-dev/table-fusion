/** @type {import('next').NextConfig} */
// Author: Onur Sevinc - https://onursevinc.dev

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
