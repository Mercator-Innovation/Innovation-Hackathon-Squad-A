// Made-up "photos" of damp and mould for the demo: simple drawings, not real photos.
// Each one is a picture of a wall with spots or patches, built from shapes.
(function () {
  const svg = (wall, marks) => "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">` +
    `<rect width="320" height="240" fill="${wall}"/>` + marks + `</svg>`);
  const spots = (cx, cy, n, r, colour) => Array.from({ length: n }, (_, i) => {
    const a = i * 2.39996, d = Math.sqrt(i) * r * 1.6;
    return `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" r="${(r * (0.5 + (i % 3) * 0.35)).toFixed(1)}" fill="${colour}" opacity="0.8"/>`;
  }).join("");
  window.SAMPLE_PHOTOS = {
    corner: svg("#e8e1d3", `<rect x="0" y="0" width="320" height="18" fill="#d9d1c2"/>` + spots(280, 30, 40, 6, "#2b2b2b") + spots(250, 60, 18, 4, "#3f4a3a")),
    window: svg("#dfe6ea", `<rect x="60" y="40" width="200" height="150" fill="#b9d3e3" stroke="#8a8f94" stroke-width="10"/>` +
      `<rect x="55" y="190" width="210" height="14" fill="#cfcac0"/>` + spots(80, 196, 20, 3, "#222") + spots(240, 196, 16, 3, "#2e3a2c") +
      `<path d="M120 60 v40 M170 70 v55 M220 55 v30" stroke="#ffffff" stroke-width="4" opacity="0.7"/>`),
    patch: svg("#ece4d6", `<ellipse cx="150" cy="140" rx="90" ry="60" fill="#c9b99a" opacity="0.7"/>` + spots(150, 140, 50, 5, "#3a3a30") +
      `<path d="M60 60 q20 10 40 0 t40 0" stroke="#bfae90" stroke-width="6" fill="none"/>`)
  };
})();
