/**
 * Canvas-based renderer for compositing logo onto tiger images.
 */
import { IMG_WIDTH, IMG_HEIGHT } from './coordinates.js';

/**
 * Load an image from URL and return an HTMLImageElement.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Convert SVG text to a data URL for safe Canvas rendering (CORS-free).
 */
function svgToDataUrl(svgText) {
  const encoded = btoa(unescape(encodeURIComponent(svgText)));
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Render the final composite image onto a canvas and return it.
 * @param {string} baseSrc - URL of the tiger PNG
 * @param {Array<{placement: {x,y,w,h}, svgText: string, posX: number, posY: number, rotation: number, scale: number}>} regions
 * @returns {Promise<HTMLCanvasElement>}
 */
async function renderComposite(baseSrc, regions) {
  const canvas = document.createElement('canvas');
  canvas.width = IMG_WIDTH;
  canvas.height = IMG_HEIGHT;
  const ctx = canvas.getContext('2d');

  const baseImg = await loadImage(baseSrc);
  ctx.drawImage(baseImg, 0, 0, IMG_WIDTH, IMG_HEIGHT);

  for (const { placement: p, svgText, posX = p.x, posY = p.y, rotation = 0, scale = 1 } of regions) {
    const logoDataUrl = svgToDataUrl(svgText);
    const logoImg = await loadImage(logoDataUrl);

    const logoAspect = logoImg.naturalWidth / logoImg.naturalHeight;
    const regionAspect = p.w / p.h;
    let fitW, fitH;
    if (logoAspect > regionAspect) {
      fitW = p.w;
      fitH = p.w / logoAspect;
    } else {
      fitH = p.h;
      fitW = p.h * logoAspect;
    }
    const scaledW = fitW * scale;
    const scaledH = fitH * scale;
    const cx = posX + p.w / 2;
    const cy = posY + p.h / 2;

    if (rotation) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(logoImg, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
      ctx.restore();
    } else {
      const drawX = cx - scaledW / 2;
      const drawY = cy - scaledH / 2;
      ctx.drawImage(logoImg, drawX, drawY, scaledW, scaledH);
    }
  }

  return canvas;
}

/**
 * Download the composite as a PNG file.
 */
async function downloadComposite(baseSrc, regions, filename) {
  const canvas = await renderComposite(baseSrc, regions);
  const link = document.createElement('a');
  link.download = filename || 'devrang-custom.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export { renderComposite, downloadComposite, svgToDataUrl, loadImage };
