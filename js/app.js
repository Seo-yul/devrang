/**
 * Main application: state management, UI interactions, preview rendering.
 */
import { IMAGE_COORDS, IMG_WIDTH, IMG_HEIGHT } from './coordinates.js';
import { downloadComposite, svgToDataUrl } from './renderer.js';
import { LOGOS } from './logo-list.js';

// ── State ──
let currentCharacter = 'tiger';
let flagSvgText = null;
let bellySvgText = null;
let flagSelectedLogo = null;
let bellySelectedLogo = null;
let flagScale = 1.0;
let bellyScale = 1.0;
let flagEnabled = true;
let bellyEnabled = false;
let flagX = IMAGE_COORDS['tiger'].flag.x;
let flagY = IMAGE_COORDS['tiger'].flag.y;
let flagRotation = 0;
let bellyX = IMAGE_COORDS['tiger'].belly.x;  // 370
let bellyY = IMAGE_COORDS['tiger'].belly.y;  // 895
let bellyRotation = 0;

// SVG text cache to avoid redundant fetches
const svgCache = new Map();

// ── DOM refs ──
const baseImage = document.getElementById('base-image');
const flagOverlay = document.getElementById('flag-overlay');
const bellyOverlay = document.getElementById('belly-overlay');
const downloadBtn = document.getElementById('download-btn');
const flagToggle = document.getElementById('flag-toggle');
const bellyToggle = document.getElementById('belly-toggle');
const charTabs = document.querySelectorAll('.char-tab');

const flagGrid = document.getElementById('flag-grid');
const bellyGrid = document.getElementById('belly-grid');
const flagSearch = document.getElementById('flag-search');
const bellySearch = document.getElementById('belly-search');
const flagGallerySection = document.getElementById('flag-gallery-section');
const bellyGallerySection = document.getElementById('belly-gallery-section');

const flagOffsetXInput = document.getElementById('flag-offset-x');
const flagOffsetYInput = document.getElementById('flag-offset-y');
const flagRotationInput = document.getElementById('flag-rotation');
const bellyOffsetXInput = document.getElementById('belly-offset-x');
const bellyOffsetYInput = document.getElementById('belly-offset-y');
const bellyRotationInput = document.getElementById('belly-rotation');

const flagScaleSlider = document.getElementById('flag-scale');
const flagScaleValue = document.getElementById('flag-scale-value');
const bellyScaleSlider = document.getElementById('belly-scale');
const bellyScaleValue = document.getElementById('belly-scale-value');

// ── Logo fetching ──
async function fetchSvgText(filename) {
  if (svgCache.has(filename)) return svgCache.get(filename);
  const resp = await fetch(`logos/${filename}`);
  const text = await resp.text();
  svgCache.set(filename, text);
  return text;
}

// ── Gallery rendering ──
function renderGrid(gridEl, logos, selectedLogo, onSelect) {
  gridEl.innerHTML = '';
  for (const name of logos) {
    const cell = document.createElement('div');
    cell.className = 'logo-grid-item' + (name === selectedLogo ? ' selected' : '');
    cell.title = name;

    const img = document.createElement('img');
    img.src = `logos/${name}`;
    img.alt = name;
    img.loading = 'lazy';
    cell.appendChild(img);

    cell.addEventListener('click', () => onSelect(name));
    gridEl.appendChild(cell);
  }
}

function filteredLogos(query) {
  if (!query) return LOGOS;
  const q = query.toLowerCase();
  return LOGOS.filter(name => name.toLowerCase().includes(q));
}

function renderFlagGrid() {
  const logos = filteredLogos(flagSearch.value);
  renderGrid(flagGrid, logos, flagSelectedLogo, async (name) => {
    flagSelectedLogo = name;
    flagSvgText = await fetchSvgText(name);
    renderFlagGrid();
    updateOverlays();
  });
}

function renderBellyGrid() {
  const logos = filteredLogos(bellySearch.value);
  renderGrid(bellyGrid, logos, bellySelectedLogo, async (name) => {
    bellySelectedLogo = name;
    bellySvgText = await fetchSvgText(name);
    renderBellyGrid();
    updateOverlays();
  });
}

flagSearch.addEventListener('input', renderFlagGrid);
bellySearch.addEventListener('input', renderBellyGrid);

// ── Character switching ──
function selectCharacter(key) {
  currentCharacter = key;
  const data = IMAGE_COORDS[key];
  baseImage.src = data.src;

  charTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.char === key);
  });

  // Sync coordinates to selected character
  flagX = data.flag.x;
  flagY = data.flag.y;
  flagOffsetXInput.value = flagX;
  flagOffsetYInput.value = flagY;

  bellyX = data.belly.x;
  bellyY = data.belly.y;
  bellyOffsetXInput.value = bellyX;
  bellyOffsetYInput.value = bellyY;

  updateOverlays();
}

charTabs.forEach(tab => {
  tab.addEventListener('click', () => selectCharacter(tab.dataset.char));
});

// ── Scale sliders ──
flagScaleSlider.addEventListener('input', () => {
  flagScale = parseFloat(flagScaleSlider.value);
  flagScaleValue.textContent = `${Math.round(flagScale * 100)}%`;
  updateOverlays();
});

bellyScaleSlider.addEventListener('input', () => {
  bellyScale = parseFloat(bellyScaleSlider.value);
  bellyScaleValue.textContent = `${Math.round(bellyScale * 100)}%`;
  updateOverlays();
});

// ── Toggles ──
flagToggle.addEventListener('change', () => {
  flagEnabled = flagToggle.checked;
  flagGallerySection.style.display = flagEnabled ? '' : 'none';
  updateOverlays();
});

bellyToggle.addEventListener('change', () => {
  bellyEnabled = bellyToggle.checked;
  bellyGallerySection.style.display = bellyEnabled ? '' : 'none';
  updateOverlays();
});

// ── Position / Rotation inputs ──
flagOffsetXInput.addEventListener('input', () => { flagX = parseInt(flagOffsetXInput.value) || 0; updateOverlays(); });
flagOffsetYInput.addEventListener('input', () => { flagY = parseInt(flagOffsetYInput.value) || 0; updateOverlays(); });
flagRotationInput.addEventListener('input', () => { flagRotation = parseFloat(flagRotationInput.value) || 0; updateOverlays(); });
bellyOffsetXInput.addEventListener('input', () => { bellyX = parseInt(bellyOffsetXInput.value) || 0; updateOverlays(); });
bellyOffsetYInput.addEventListener('input', () => { bellyY = parseInt(bellyOffsetYInput.value) || 0; updateOverlays(); });
bellyRotationInput.addEventListener('input', () => { bellyRotation = parseFloat(bellyRotationInput.value) || 0; updateOverlays(); });

// ── Preview overlay positioning ──
function updateOverlays() {
  const data = IMAGE_COORDS[currentCharacter];

  positionOverlay(flagOverlay, data.flag, flagEnabled && !!flagSvgText, flagSvgText, flagX, flagY, flagRotation, flagScale);

  const bellyActive = bellyEnabled && data.belly.enabled && !!bellySvgText;
  positionOverlay(bellyOverlay, data.belly, bellyActive, bellySvgText, bellyX, bellyY, bellyRotation, bellyScale);
}

function positionOverlay(el, region, visible, svgText, posX, posY, rotation, scale) {
  if (!visible) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';

  const scaledW = region.w * scale;
  const scaledH = region.h * scale;
  const cx = posX + region.w / 2;
  const cy = posY + region.h / 2;
  const drawX = cx - scaledW / 2;
  const drawY = cy - scaledH / 2;

  el.style.left = `${(drawX / IMG_WIDTH) * 100}%`;
  el.style.top = `${(drawY / IMG_HEIGHT) * 100}%`;
  el.style.width = `${(scaledW / IMG_WIDTH) * 100}%`;
  el.style.height = `${(scaledH / IMG_HEIGHT) * 100}%`;
  el.style.transform = rotation ? `rotate(${rotation}deg)` : '';

  const dataUrl = svgToDataUrl(svgText);
  el.style.backgroundImage = `url("${dataUrl}")`;
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = 'center';
}

// ── Download ──
downloadBtn.addEventListener('click', async () => {
  const data = IMAGE_COORDS[currentCharacter];
  const regions = [];

  if (flagEnabled && flagSvgText) regions.push({ placement: data.flag, svgText: flagSvgText, posX: flagX, posY: flagY, rotation: flagRotation, scale: flagScale });
  if (bellyEnabled && data.belly.enabled && bellySvgText) regions.push({ placement: data.belly, svgText: bellySvgText, posX: bellyX, posY: bellyY, rotation: bellyRotation, scale: bellyScale });

  const filename = `${currentCharacter}-custom.png`;
  downloadBtn.disabled = true;
  downloadBtn.textContent = '처리 중...';

  try {
    await downloadComposite(data.src, regions, filename);
  } catch (err) {
    console.error('Download failed:', err);
    alert('다운로드에 실패했습니다. 콘솔을 확인해주세요.');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'PNG 다운로드';
  }
});

// ── Init ──
renderFlagGrid();
renderBellyGrid();
selectCharacter('tiger');
