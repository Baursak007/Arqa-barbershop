/* Делает assets/og-image.jpg из tools/og-source.html. Нужен установленный playwright: npm i playwright */
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto("file://" + path.join(__dirname, "og-source.html"));
  await p.screenshot({ path: path.join(__dirname, "../assets/og-image.jpg"), type: "jpeg", quality: 80 });
  await b.close();
})();
