/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Inyectamos el plugin para evitar que busque archivos inexistentes
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /tflite_web_api_client/,
          (resource) => {
            resource.request = resource.request.replace(
              /.*tflite_web_api_client.*/,
              'path' 
            );
          }
        )
      );
    }

    // BLOQUEO DE ERRORES: Fuerza a Webpack a ignorar los archivos rotos
    config.resolve.alias = {
      ...config.resolve.alias,
      './tflite_web_api_client': false,
      '../tflite_web_api_client': false,
    };

    return config;
  },
}

module.exports = nextConfig
