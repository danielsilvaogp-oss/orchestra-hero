/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer, webpack }) => {
    // Handle TensorFlow.js TFLite issues - Block broken modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tensorflow/tfjs-tflite': false,
      'tflite_web_api_client': false,
      './tflite_web_api_client': false,
      '../tflite_web_api_client': false,
    }

    // Fallback for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })

    // Plugin to handle missing files
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /tflite_web_api_client/,
          (resource) => {
            resource.request = 'path'
          }
        )
      )
    }

    return config
  },
}

module.exports = nextConfig