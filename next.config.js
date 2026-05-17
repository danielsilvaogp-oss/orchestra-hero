/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Handle TensorFlow.js TFLite issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tensorflow/tfjs-tflite': false,
      'tflite_web_api_client': false,
    }

    // Fallback for problematic modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    // Handle TFLite WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })

    return config
  },
}

module.exports = nextConfig