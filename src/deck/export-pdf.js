const PDF_WIDTH = 1200;
const PDF_HEIGHT = 675;
const RENDER_SCALE = 2;

export function bindExportPdf({ deck }) {
  const button = document.querySelector('[data-action="export-pdf"]');

  button.addEventListener("click", async () => {
    const originalLabel = button.textContent;
    const progress = createExportProgress();
    button.disabled = true;
    button.textContent = "EXPORTING";
    progress.show("准备导出", 0.02);

    try {
      progress.update("加载字体和样式", 0.06);
      await waitForStableLayout();
      const slides = [...deck.stageElement.querySelectorAll(".slide")];
      const stylesheetText = collectDocumentStyles();
      const images = [];

      for (const [index, slide] of slides.entries()) {
        progress.update(`渲染第 ${index + 1} / ${slides.length} 页`, 0.08 + (index / slides.length) * 0.84);
        images.push(await renderSlideToJpeg(slide, stylesheetText));
      }

      progress.update("生成 PDF 文件", 0.95);
      downloadBlob(buildPdf(images), "ultrafilter-business-plan.pdf");
      progress.update("导出完成", 1);
      setTimeout(() => progress.hide(), 650);
    } catch (error) {
      console.error("PDF export failed", error);
      progress.fail("导出失败，请重试");
      button.textContent = "EXPORT FAILED";
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });

  window.addEventListener("beforeprint", () => {
    deck.setPrintExport(true);
  });

  window.addEventListener("afterprint", () => {
    setTimeout(() => deck.setPrintExport(false), 0);
  });
}

async function waitForStableLayout() {
  await waitForStylesheets();

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

async function waitForStylesheets() {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  await Promise.all(links.map(waitForStylesheet));
}

function waitForStylesheet(link) {
  if (link.sheet) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 3000);
    const done = () => {
      clearTimeout(timeout);
      resolve();
    };

    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
  });
}

async function renderSlideToJpeg(slide, stylesheetText) {
  const clone = slide.cloneNode(true);
  prepareSlideClone(clone);

  await inlineImages(slide, clone);

  const page = document.createElement("div");
  page.className = "pdf-snapshot-page";
  page.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  page.style.background = getComputedStyle(document.documentElement).getPropertyValue("--paper-bg").trim() || "#f2f0e9";
  page.style.height = `${PDF_HEIGHT}px`;
  page.style.overflow = "hidden";
  page.style.position = "relative";
  page.style.width = `${PDF_WIDTH}px`;
  appendStylesheet(page, stylesheetText);
  page.appendChild(clone);
  appendPageNumber(page, slide.dataset.pageLabel);

  const host = mountExportPage(page);

  try {
    await waitForStableLayout();
    await waitForImages(page);
    inlineComputedStyles(page);
  } finally {
    host.remove();
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PDF_WIDTH}" height="${PDF_HEIGHT}">`,
    `<foreignObject width="${PDF_WIDTH}" height="${PDF_HEIGHT}">`,
    new XMLSerializer().serializeToString(page),
    "</foreignObject>",
    "</svg>",
  ].join("");

  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement("canvas");
  canvas.width = PDF_WIDTH * RENDER_SCALE;
  canvas.height = PDF_HEIGHT * RENDER_SCALE;

  const context = canvas.getContext("2d");
  context.fillStyle = page.style.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
  return base64ToBytes(dataUrl.split(",")[1]);
}

function prepareSlideClone(slide) {
  slide.classList.add("active");
  slide.classList.add("pdf-snapshot");
  slide.style.display = "flex";
  slide.style.flexDirection = "column";
  slide.style.height = "100%";
  slide.style.left = "0";
  slide.style.opacity = "1";
  slide.style.position = "absolute";
  slide.style.top = "0";
  slide.style.transform = "none";
  slide.style.visibility = "visible";
  slide.style.width = "100%";
}

function mountExportPage(page) {
  const host = document.createElement("div");
  host.style.height = `${PDF_HEIGHT}px`;
  host.style.left = "-10000px";
  host.style.opacity = "0";
  host.style.overflow = "hidden";
  host.style.pointerEvents = "none";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.width = `${PDF_WIDTH}px`;
  host.style.zIndex = "-1";
  host.appendChild(page);
  document.body.appendChild(host);
  return host;
}

async function inlineImages(sourceRoot, cloneRoot) {
  const sourceImages = [...sourceRoot.querySelectorAll("img")];
  const cloneImages = [...cloneRoot.querySelectorAll("img")];

  await Promise.all(
    sourceImages.map(async (sourceImage, index) => {
      const cloneImage = cloneImages[index];
      if (!cloneImage) return;

      cloneImage.removeAttribute("srcset");
      cloneImage.loading = "eager";
      cloneImage.decoding = "sync";
      cloneImage.src = await imageToDataUrl(sourceImage.currentSrc || sourceImage.src);
    }),
  );
}

async function imageToDataUrl(src) {
  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load image for PDF export: ${src}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    canvas.getContext("2d").drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function inlineComputedStyles(root) {
  const nodes = [root, ...root.querySelectorAll("*")];
  const snapshots = nodes.map((node) => ({
    node,
    styles: readComputedStyles(node),
  }));

  snapshots.forEach(({ node, styles }) => {
    const style = node.style;
    styles.forEach(([property, value, priority]) => {
      style.setProperty(property, value, priority);
    });
  });
}

function readComputedStyles(node) {
  const computed = getComputedStyle(node);
  const styles = [];

  for (const property of computed) {
    styles.push([property, computed.getPropertyValue(property), computed.getPropertyPriority(property)]);
  }

  return styles;
}

function appendStylesheet(page, stylesheetText) {
  const style = document.createElement("style");
  style.textContent = stylesheetText;
  page.appendChild(style);
}

function collectDocumentStyles() {
  return [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

function appendPageNumber(page, label) {
  const pageNumber = document.createElement("div");
  pageNumber.textContent = label;
  pageNumber.style.bottom = "30px";
  pageNumber.style.color = "var(--ink-black)";
  pageNumber.style.fontFamily = '"JetBrains Mono", monospace';
  pageNumber.style.fontSize = "10px";
  pageNumber.style.opacity = "0.4";
  pageNumber.style.position = "absolute";
  pageNumber.style.right = "40px";
  page.appendChild(pageNumber);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function waitForImages(root) {
  const images = [...root.querySelectorAll("img")];

  await Promise.all(
    images.map(async (image) => {
      if (image.decode) {
        try {
          await image.decode();
          return;
        } catch {
          // Fall back to the load/error events below. Some browsers reject
          // decode() for images that still render correctly.
        }
      }

      if (image.complete) return;

      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );
}

function createExportProgress() {
  let root = document.querySelector(".export-progress");

  if (!root) {
    root = document.createElement("div");
    root.className = "export-progress";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
    root.innerHTML = `
      <div class="export-progress__panel">
        <div class="export-progress__label">准备导出</div>
        <div class="export-progress__track">
          <div class="export-progress__bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
  }

  const label = root.querySelector(".export-progress__label");
  const bar = root.querySelector(".export-progress__bar");

  return {
    show(text, value) {
      root.classList.add("is-visible");
      root.classList.remove("is-error");
      this.update(text, value);
    },
    update(text, value) {
      label.textContent = text;
      bar.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
    },
    fail(text) {
      root.classList.add("is-visible");
      root.classList.add("is-error");
      label.textContent = text;
      bar.style.width = "100%";
    },
    hide() {
      root.classList.remove("is-visible");
      root.classList.remove("is-error");
    },
  };
}

function buildPdf(images) {
  const objects = [];
  const pages = [];

  const catalogRef = addObject(objects, "<< /Type /Catalog /Pages 2 0 R >>");
  const pagesRef = addPlaceholder(objects);

  images.forEach((imageBytes, index) => {
    const imageRef = addStreamObject(
      objects,
      `<< /Type /XObject /Subtype /Image /Width ${PDF_WIDTH * RENDER_SCALE} /Height ${PDF_HEIGHT * RENDER_SCALE} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`,
      imageBytes,
    );
    const content = asciiBytes(`q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im${index + 1} Do\nQ\n`);
    const contentRef = addStreamObject(objects, `<< /Length ${content.length} >>`, content);
    const pageRef = addObject(
      objects,
      `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /Im${index + 1} ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`,
    );
    pages.push(pageRef);
  });

  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${pages.map((pageRef) => `${pageRef} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  const parts = [asciiBytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = [0];
  let length = parts[0].length;

  objects.forEach((object, index) => {
    offsets.push(length);
    const header = asciiBytes(`${index + 1} 0 obj\n`);
    const footer = asciiBytes("\nendobj\n");
    parts.push(header, typeof object === "string" ? asciiBytes(object) : object, footer);
    length += header.length + byteLength(object) + footer.length;
  });

  const xrefOffset = length;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");
  parts.push(asciiBytes(xref));

  return new Blob(parts, { type: "application/pdf" });
}

function addObject(objects, object) {
  objects.push(object);
  return objects.length;
}

function addPlaceholder(objects) {
  objects.push("");
  return objects.length;
}

function addStreamObject(objects, dictionary, bytes) {
  const stream = concatBytes(asciiBytes(`${dictionary}\nstream\n`), bytes, asciiBytes("\nendstream"));
  objects.push(stream);
  return objects.length;
}

function byteLength(object) {
  return typeof object === "string" ? asciiBytes(object).length : object.length;
}

function asciiBytes(text) {
  const bytes = new Uint8Array(text.length);

  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index) & 0xff;
  }

  return bytes;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  return asciiBytes(binary);
}

function concatBytes(...chunks) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;

  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.length;
  });

  return bytes;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
