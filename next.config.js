/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // 1. Evitar que Webpack busque módulos de Node en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // 2. Regla agresiva para silenciar los errores de tfjs-tflite
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@tensorflow\/tfjs-tflite/,
      loader: 'string-replace-loader',
      options: {
        // Buscamos cualquier intento de requerir el cliente problemático
        search: /require\(['"]\.\.?\/tflite_web_api_client['"]\)/g,
        replace: 'null',
      },
    });

    return config;
  },
}

module.exports = nextConfig
