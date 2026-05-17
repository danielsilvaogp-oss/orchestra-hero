/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'cdnjs.cloudflare.com'],
  },
  webpack: (config, { isServer, webpack }) => {
    // Handle TensorFlow.js TFLite issues
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

    // Handle pdfjs worker
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      }
    }

    return config
  },
}

module.exports = nextConfig