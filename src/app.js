import { slides } from "./deck/manifest.js?v=20260507-ecosystem13";
import { DeckController } from "./deck/deck-controller.js?v=20260507-ecosystem13";
import { bindExportPdf } from "./deck/export-pdf.js?v=20260507-ecosystem13";
import { LanguageController } from "./deck/language.js?v=20260507-ecosystem13";
import { ProgressController } from "./deck/progress.js?v=20260507-ecosystem13";
import { bindResponsiveDeck } from "./deck/responsive-deck.js?v=20260507-ecosystem13";

const deck = new DeckController({
  deckElement: document.getElementById("deck"),
  stageElement: document.getElementById("slideStage"),
  pageNumElement: document.getElementById("pageNum"),
  slides,
});

const progress = new ProgressController({
  container: document.getElementById("navControls"),
  slides,
  onSelect: (index) => deck.showSlide(index),
});

const language = new LanguageController({
  button: document.querySelector('[data-action="language"]'),
  initialLanguage: "zh",
});

console.log("App starting...");
bindResponsiveDeck();
console.log("Loading deck...");
try {
  await deck.load();
  console.log("Deck loaded.");
} catch (e) {
  console.error("Failed to load deck:", e);
}
progress.render();
progress.setActive(deck.currentSlide);
language.apply();

deck.onChange((index) => {
  progress.setActive(index);
});

document.querySelector('[data-action="prev"]').addEventListener("click", () => deck.prev());
document.querySelector('[data-action="next"]').addEventListener("click", () => deck.next());

language.button.addEventListener("click", () => language.toggle());
bindExportPdf({ deck });

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    deck.next();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    deck.prev();
  }
});
