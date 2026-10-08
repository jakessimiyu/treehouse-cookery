/** @type {import('next').NextConfig} */
const nextConfig = {
  // lets your phone load the dev server over wifi (development only)
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*'],
  outputFileTracingIncludes: { '/*': ['./node_modules/pg-cloudflare/**/*'] },
};
export default nextConfig;