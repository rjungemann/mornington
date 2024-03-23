/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TICK_INTERVAL: process.env.TICK_INTERVAL,
    API_URL: process.env.API_URL,
    GA_ID: process.env.GA_ID,
  }
};

export default nextConfig;
