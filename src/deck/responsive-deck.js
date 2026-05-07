const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 675;
const DESKTOP_VIEWPORT_PADDING_X = 48;
const DESKTOP_TOOLBAR_SPACE = 104;
const MOBILE_LANDSCAPE_PADDING_X = 16;
const MOBILE_LANDSCAPE_TOOLBAR_SPACE = 18;
const MOBILE_PORTRAIT_READING_SCALE = 0.68;
const MOBILE_PORTRAIT_MIN_SCALE = 0.58;
const MOBILE_PORTRAIT_MAX_SCALE = 0.76;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function bindResponsiveDeck() {
  let frame = 0;

  const updateScale = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const viewport = window.visualViewport ?? window;
      const viewportWidth = viewport.width ?? window.innerWidth;
      const viewportHeight = viewport.height ?? window.innerHeight;
      const isMobile = viewportWidth <= 820 || window.matchMedia("(pointer: coarse)").matches;
      const isPortrait = viewportHeight >= viewportWidth;
      const isMobilePortrait = isMobile && isPortrait;
      const isMobileLandscape = isMobile && !isPortrait;
      let scale;

      document.body.classList.toggle("is-mobile", isMobile);
      document.body.classList.toggle("is-mobile-portrait", isMobilePortrait);
      document.body.classList.toggle("is-mobile-landscape", isMobileLandscape);

      if (isMobilePortrait) {
        const heightSafeScale = (viewportHeight - 120) / CANVAS_HEIGHT;
        scale = clamp(
          Math.min(Math.max(MOBILE_PORTRAIT_READING_SCALE, heightSafeScale), MOBILE_PORTRAIT_MAX_SCALE),
          MOBILE_PORTRAIT_MIN_SCALE,
          MOBILE_PORTRAIT_MAX_SCALE,
        );
      } else if (isMobileLandscape) {
        const availableWidth = Math.max(320, viewportWidth - MOBILE_LANDSCAPE_PADDING_X);
        const availableHeight = Math.max(240, viewportHeight - MOBILE_LANDSCAPE_TOOLBAR_SPACE);
        scale = Math.min(availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT, 1);
      } else {
        const availableWidth = Math.max(320, viewportWidth - DESKTOP_VIEWPORT_PADDING_X);
        const availableHeight = Math.max(180, viewportHeight - DESKTOP_TOOLBAR_SPACE);
        scale = Math.min(availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT, 1);
      }

      document.documentElement.style.setProperty("--slide-scale", String(scale));
      document.documentElement.style.setProperty("--scaled-slide-width", `${CANVAS_WIDTH * scale}px`);
      document.documentElement.style.setProperty("--scaled-slide-height", `${CANVAS_HEIGHT * scale}px`);
    });
  };

  updateScale();
  window.addEventListener("resize", updateScale);
  window.addEventListener("orientationchange", updateScale);
  window.visualViewport?.addEventListener("resize", updateScale);
}
