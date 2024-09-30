/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "frame-src 'self' https://*.zoom.us;",
            },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;