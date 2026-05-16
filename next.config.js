/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // ESTO ES LO QUE FALTA: Bloquea el escaneo de los archivos que causan el error
    config.resolve.alias = {
      ...config.resolve.alias,
      './tflite_web_api_client': false,
      '../tflite_web_api_client': false,
    };

    return config;
  },
}

module.exports = nextConfig
