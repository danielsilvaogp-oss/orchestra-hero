/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Evita que Webpack intente resolver módulos de Node.js en el navegador
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // Ignora los errores de resolución específicos de tfjs-tflite
    config.module.rules.push({
      test: /tflite_model\.js$/,
      loader: 'string-replace-loader',
      options: {
        search: "require('./tflite_web_api_client')",
        replace: "null",
      },
    });

    return config;
  },
}

module.exports = nextConfig
