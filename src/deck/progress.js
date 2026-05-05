export class ProgressController {
  constructor({ container, slides, onSelect }) {
    this.container = container;
    this.slides = slides;
    this.onSelect = onSelect;
  }

  render() {
    const dots = this.slides.map((slide) => {
      const dot = document.createElement("button");
      dot.className = "nav-dot";
      dot.type = "button";
      dot.dataset.index = String(slide.index);
      dot.title = `${String(slide.index).padStart(2, "0")} ${slide.title}`;
      dot.setAttribute("aria-label", dot.title);
      dot.addEventListener("click", () => this.onSelect(slide.index));
      return dot;
    });

    this.container.replaceChildren(...dots);
  }

  setActive(index) {
    this.container.querySelectorAll(".nav-dot").forEach((dot) => {
      dot.classList.toggle("active", Number(dot.dataset.index) === index);
    });
  }
}
