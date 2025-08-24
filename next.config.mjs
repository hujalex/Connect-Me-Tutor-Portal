/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
    // !! WARN !!
    // This allows production builds to successfully complete
    // even if your project has type errors.
    ignoreBuildErrors: true,
  },
      output: 'standalone', // Feel free to modify/remove this option
    
    // Indicate that these packages should not be bundled by webpack
    experimental: {
        serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
    },
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