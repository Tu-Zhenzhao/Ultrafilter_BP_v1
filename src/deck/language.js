export class LanguageController {
  constructor({ button, initialLanguage = "zh" }) {
    this.button = button;
    this.language = initialLanguage;
  }

  toggle() {
    this.language = this.language === "zh" ? "en" : "zh";
    this.apply();
  }

  apply() {
    document.documentElement.lang = this.language === "zh" ? "zh-CN" : "en";
    document.body.dataset.language = this.language;
    this.button.textContent = this.language === "zh" ? "中文" : "EN";
    this.button.title = this.language === "zh" ? "Switch to English" : "切换到中文";
  }
}
