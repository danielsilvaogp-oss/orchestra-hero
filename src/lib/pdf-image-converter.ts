// PDF to Image Converter using pdf.js
// Converts PDF pages to canvas images for OCR processing

export async function pdfToImages(file: File): Promise<HTMLImageElement[]> {
  const images: HTMLImageElement[] = []
  
  try {
    // Dynamic import for pdfjs-dist
    const pdfjs = await import('pdfjs-dist')
    
    // Set worker
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
    
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better quality
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise
      
      // Convert canvas to image
      const img = new Image()
      img.src = canvas.toDataURL('image/png')
      await new Promise(resolve => img.onload = resolve)
      
      images.push(img)
    }
  } catch (e) {
    console.error('PDF conversion error:', e)
  }
  
  return images
}

export async function imageToTensor(image: HTMLImageElement): Promise<any> {
  const tf = await import('@tensorflow/tfjs')
  
  // Resize to 640x640
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  
  // Draw image centered on white background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 640, 640)
  
  const scale = Math.min(640 / image.width, 640 / image.height)
  const x = (640 - image.width * scale) / 2
  const y = (640 - image.height * scale) / 2
  ctx.drawImage(image, x, y, image.width * scale, image.height * scale)
  
  // Get pixel data
  const imageData = ctx.getImageData(0, 0, 640, 640)
  const pixels = imageData.data
  
  // Normalize to [0, 1] and convert to tensor [1, 640, 640, 3]
  const normalized = new Float32Array(640 * 640 * 3)
  for (let i = 0; i < pixels.length; i += 4) {
    const idx = i / 4
    normalized[idx] = pixels[i] / 255
    normalized[idx + 640 * 640] = pixels[i + 1] / 255
    normalized[idx + 2 * 640 * 640] = pixels[i + 2] / 255
  }
  
  return tf.tensor4d(normalized, [1, 640, 640, 3])
}

export default { pdfToImages, imageToTensor }