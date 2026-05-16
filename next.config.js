/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Ignoramos errores de tipos para que el despliegue de la Hammer Academy sea rápido
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Solución para módulos de Node en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // REEMPLAZO DINÁMICO: Evita el error "Cannot find module './tflite_web_api_client'" en el navegador
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /tflite_web_api_client/,
          (resource) => {
            resource.request = resource.request.replace(
              /.*tflite_web_api_client.*/,
              'path' // Reemplazamos por un módulo inofensivo
            );
          }
        )
      );
    }

    // ALIAS: Engañamos a Webpack para que no busque los archivos inexistentes de TFLite
    config.resolve.alias = {
      ...config.resolve.alias,
      './tflite_web_api_client': false,
      '../tflite_web_api_client': false,
    };

    return config;
  },
}

module.exports = nextConfig
