export class DeckController {
  constructor({ deckElement, stageElement, pageNumElement, slides }) {
    this.deckElement = deckElement;
    this.stageElement = stageElement;
    this.pageNumElement = pageNumElement;
    this.slides = slides;
    this.currentSlide = 1;
    this.callbacks = [];
    this.isPrintExport = false;
    this.assetVersion = Date.now().toString();
  }

  async load() {
    const fragments = await Promise.all(
      this.slides.map(async (slide) => {
        this.loadSlideStyles(slide);
        const response = await fetch(`./src/slides/${slide.slug}/slide.html?v=${this.assetVersion}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          console.error(`Unable to load slide ${slide.index}: ${slide.slug}`);
          return this.createMissingSlide(slide, response.status);
        }

        const section = document.createElement("section");
        section.className = "slide";
        section.dataset.index = String(slide.index);
        section.dataset.slug = slide.slug;
        section.dataset.pageLabel = `${String(slide.index).padStart(2, "0")} / ${this.slides.length}`;
        section.setAttribute("aria-label", `${String(slide.index).padStart(2, "0")} ${slide.title}`);
        section.innerHTML = await response.text();
        return section;
      }),
    );

    this.stageElement.replaceChildren(...fragments);
    this.showSlide(1);
  }

  loadSlideStyles(slide) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `./src/slides/${slide.slug}/slide.css?v=${this.assetVersion}`;
    link.dataset.slideStyle = slide.slug;
    document.head.appendChild(link);
  }

  createMissingSlide(slide, status) {
    const section = document.createElement("section");
    section.className = "slide";
    section.dataset.index = String(slide.index);
    section.dataset.slug = slide.slug;
    section.dataset.pageLabel = `${String(slide.index).padStart(2, "0")} / ${this.slides.length}`;
    section.setAttribute("aria-label", `${String(slide.index).padStart(2, "0")} ${slide.title}`);
    section.innerHTML = `
      <div class="debossed" style="margin: auto; max-width: 620px; padding: 36px;">
        <p class="mono" style="color: var(--ink-red); margin-bottom: 16px;">SLIDE LOAD ERROR // ${status}</p>
        <h2 style="font-size: 34px; margin-bottom: 16px;">Missing slide: ${slide.slug}</h2>
        <p style="color: var(--ink-grey); font-size: 15px; line-height: 1.6;">
          Check <span class="mono">src/deck/manifest.js</span> and
          <span class="mono">src/slides/${slide.slug}/slide.html</span>.
        </p>
      </div>
    `;
    return section;
  }

  showSlide(index) {
    if (index < 1 || index > this.slides.length) return;
    this.currentSlide = index;
    this.stageElement.querySelectorAll(".slide").forEach((slide) => {
      slide.classList.toggle("active", Number(slide.dataset.index) === index);
    });
    this.updatePageNumber();
    this.callbacks.forEach((callback) => callback(index));
  }

  next() {
    this.showSlide(this.currentSlide + 1);
  }

  prev() {
    this.showSlide(this.currentSlide - 1);
  }

  onChange(callback) {
    this.callbacks.push(callback);
  }

  updatePageNumber() {
    this.pageNumElement.textContent = `${String(this.currentSlide).padStart(2, "0")} / ${this.slides.length}`;
  }

  setPrintExport(enabled) {
    this.isPrintExport = enabled;
    document.body.classList.toggle("print-export", enabled);
    this.deckElement.classList.toggle("is-print-export", enabled);
  }
}
