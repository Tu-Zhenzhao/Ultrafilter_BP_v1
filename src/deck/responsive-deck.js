const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 675;
const VIEWPORT_PADDING_X = 48;
const TOOLBAR_SPACE = 104;

export function bindResponsiveDeck() {
  let frame = 0;

  const updateScale = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const viewport = window.visualViewport ?? window;
      const viewportWidth = viewport.width ?? window.innerWidth;
      const viewportHeight = viewport.height ?? window.innerHeight;
      const availableWidth = Math.max(320, viewportWidth - VIEWPORT_PADDING_X);
      const availableHeight = Math.max(180, viewportHeight - TOOLBAR_SPACE);
      const scale = Math.min(availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT, 1);

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
