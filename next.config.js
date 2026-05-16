/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // 1. Ignorar módulos de Node que TFLite intenta usar en el navegador
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // 2. Bloquear la resolución de los archivos problemáticos de la librería
    config.module.rules.push({
      test: /tflite_model\.js$|bert_nl_classifier\.js$|bert_qa\.js$|common\.js$|image_classifier\.js$/,
      loader: 'string-replace-loader',
      options: {
        search: "require('./tflite_web_api_client')|require('../tflite_web_api_client')",
        replace: "null",
        flags: 'g'
      },
    });

    return config;
  },
}

module.exports = nextConfig
