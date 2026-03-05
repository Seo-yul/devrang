/**
 * Logo placement coordinates for each tiger image.
 * All values in original image pixels (832x1248).
 */
const IMAGE_COORDS = {
  'tiger': {
    src: 'assets/tiger.png',
    label: '기본',
    flag: { x: 250, y: 240, w: 390, h: 190 },
    belly: { x: 370, y: 895, w: 60, h: 80, enabled: true }
  },
  'tiger-macbook': {
    src: 'assets/tiger-macbook.png',
    label: '맥북',
    flag: { x: 250, y: 240, w: 380, h: 190 },
    belly: { x: 370, y: 925, w: 60, h: 60, enabled: true }
  },
  'tiger-coffee': {
    src: 'assets/tiger-coffee.png',
    label: '커피',
    flag: { x: 250, y: 240, w: 380, h: 190 },
    belly: { x: 335, y: 895, w: 80, h: 100, enabled: true }
  },
  'tiger-bag': {
    src: 'assets/tiger-bag.png',
    label: '가방',
    flag: { x: 250, y: 240, w: 390, h: 190 },
    belly: { x: 370, y: 920, w: 60, h: 60, enabled: true }
  }
};

// Original image dimensions
const IMG_WIDTH = 832;
const IMG_HEIGHT = 1248;

export { IMAGE_COORDS, IMG_WIDTH, IMG_HEIGHT };
