export const allSlides = [
  { index: 1, slug: "01-cover", title: "封面" },
  { index: 2, slug: "02-market-shift", title: "时代变化" },
  { index: 3, slug: "03-core-insight", title: "核心洞察" },
  { index: 4, slug: "04-pain-points", title: "痛点" },
  { index: 5, slug: "05-solution", title: "解决方案" },
  { index: 6, slug: "06-product-experience", title: "产品体验" },
  { index: 7, slug: "07-product-loop", title: "产品闭环" },
  { index: 8, slug: "08-multimodal-search", title: "场景化多模态" },
  { index: 9, slug: "09-time-cone", title: "Time-Cone Search" },
  { index: 10, slug: "10-memory-trace", title: "Memory Trace" },
  { index: 11, slug: "11-market-timing", title: "市场时机" },
  { index: 12, slug: "12-business-model", title: "商业模式" },
  { index: 13, slug: "13-ecosystem", title: "合作生态" },
  { index: 14, slug: "14-competition", title: "竞争定位" },
  { index: 15, slug: "15-founding-plan", title: "本轮融资计划" },
  { index: 16, slug: "16-team", title: "创始人与团队" },
  { index: 17, slug: "17-moat", title: "护城河" },
  { index: 18, slug: "18-milestones", title: "里程碑" },
  { index: 19, slug: "19-funding", title: "融资需求" },
  { index: 20, slug: "20-closing", title: "结尾" }
];

// Code-only publication controls.
// - visibleThrough: only show physical slides up to this number. Set to null to disable.
// - hiddenSlides: hide individual physical slide numbers or slugs.
// - onlySlides: optional allowlist of physical slide numbers or slugs. Leave empty to disable.
// Examples:
//   hiddenSlides: [5]
//   hiddenSlides: ["05-solution", "17-moat"]
//   onlySlides: [1, 2, 3, "11-market-timing", "13-ecosystem"]
// The exported slides are re-numbered for navigation and page labels.
export const publication = {
  visibleThrough: 16,
  hiddenSlides: [],
  onlySlides: [],
};

export const slides = createVisibleSlides(allSlides, publication);

function createVisibleSlides(sourceSlides, { visibleThrough = null, hiddenSlides = [], onlySlides = [] } = {}) {
  const hidden = new Set(hiddenSlides.map(String));
  const only = new Set(onlySlides.map(String));

  return sourceSlides
    .filter((slide) => {
      const isOutsideAllowlist = only.size > 0 && !only.has(String(slide.index)) && !only.has(slide.slug);
      const isAfterVisibleRange = visibleThrough !== null && slide.index > visibleThrough;
      const isHidden = hidden.has(String(slide.index)) || hidden.has(slide.slug);

      return !isOutsideAllowlist && !isAfterVisibleRange && !isHidden;
    })
    .map((slide, visibleIndex) => ({
      ...slide,
      physicalIndex: slide.index,
      index: visibleIndex + 1,
    }));
}
