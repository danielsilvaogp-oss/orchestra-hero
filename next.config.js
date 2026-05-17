/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'cdnjs.cloudflare.com', 'unpkg.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // === ANTI-ERROR BUILD: Handle broken TFLite modules ===
    
    // 1. Block broken tflite_web_api_client modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tensorflow/tfjs-tflite': false,
      '@tensorflow/tfjs-backend-tflite': false,
      'tflite_web_api_client': false,
      './tflite_web_api_client': false,
      '../tflite_web_api_client': false,
      '../../tflite_web_api_client': false,
    }

    // 2. Fallback for Node.js modules (required for some TF.js operations)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      zlib: false,
      assert: false,
    }

    // 3. Handle WASM files properly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/[hash][ext]',
      },
    })

    // 4. NormalModuleReplacementPlugin for tflite issues
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /tflite_web_api_client/,
          (resource) => {
            resource.request = 'path'
            console.warn('[Webpack] Replaced tflite module:', resource.request)
          }
        ),
        new webpack.NormalModuleReplacementPlugin(
          /@tensorflow\/tfjs-tflite/,
          (resource) => {
            resource.request = '@tensorflow/tfjs'
          }
        )
      )

      // 5. Ignore specific warnings that are not critical
      config.stats = {
        ...config.stats,
        warningsFilter: (warning) => {
          if (warning.includes('tflite') || warning.includes('wasm')) {
            return true
          }
          return false
        },
      }
    }

    return config
  },
}

module.exports = nextConfig