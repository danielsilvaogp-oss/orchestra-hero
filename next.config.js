/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer, webpack }) => {
    // 1. Manejo de fallbacks para el navegador
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // 2. FORZAR EL IGNORAR los archivos problemáticos
    // Esto crea un módulo vacío cuando Webpack busca los archivos que faltan
    config.resolve.alias = {
      ...config.resolve.alias,
      './tflite_web_api_client': false,
      '../tflite_web_api_client': false,
    };

    // 3. Plugin para ignorar los módulos problemáticos de TFLite
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /tflite_web_api_client$/,
        contextRegExp: /@tensorflow\/tfjs-tflite/,
      })
    );

    return config;
  },
}

module.exports = nextConfig
