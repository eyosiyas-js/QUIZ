/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // output: 'standalone', // recommended for Docker
  //    async rewrites() {
  //   return [
  //     {
  //       source: process.env.NEXT_PUBLIC_API_URL,
  //       // source: 'http://172.20.137.159:3002',
  //       destination: 'https://lottery.insa.gov.et/api/',
  //     },
  //   ]
  // },
}

export default nextConfig
