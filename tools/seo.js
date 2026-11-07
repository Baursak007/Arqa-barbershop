/*
  Собирает данные для поисковиков из js/data.js и записывает их в index.html,
  а также создаёт sitemap.xml и robots.txt.
  Запуск (из папки проекта):  node tools/seo.js
  Запускай заново каждый раз, когда меняешь адрес сайта, филиалы, часы работы или цены.
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "js/data.js"), "utf8");
const { CONFIG, SITE_DATA: D } = vm.runInNewContext(src + "\n({ CONFIG, SITE_DATA })");

const url = String(CONFIG.siteUrl || "").replace(/\/+$/, "");
if (!/^https:\/\/[^\s"<>]+$/.test(url)) {
  console.error("В js/data.js укажи siteUrl вида https://адрес-сайта (без слэша в конце).");
  process.exit(1);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const title = `${D.brand} — барбершоп в Астане`;
const description = `${D.brand} — сеть барбершопов в Астане: ${D.branches.length} филиалов, мужские стрижки, борода, детские стрижки. Цены от ${Math.min(...D.priceGroups.flatMap((g) => g.rows.flatMap((r) => r.prices)))} ₸. Запись онлайн в WhatsApp и Telegram.`;

const allPrices = D.priceGroups.flatMap((g) => g.rows.flatMap((r) => r.prices));
const placeholderAddr = (a) => !a || /уточня/i.test(a);
const hoursSpec = (h) => {
  const m = /(\d{1,2}:\d{2})\D+(\d{1,2}:\d{2})/.exec(h || "");
  return m ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: m[1].padStart(5, "0"), closes: m[2].padStart(5, "0") }] : undefined;
};
const branch = (b) => {
  const o = {
    "@type": "HairSalon",
    name: b.name,
    telephone: b.phone,
    address: { "@type": "PostalAddress", addressLocality: "Астана", addressCountry: "KZ", ...(placeholderAddr(b.address) ? {} : { streetAddress: b.address }) },
    openingHoursSpecification: hoursSpec(b.hours),
    priceRange: `${Math.min(...allPrices)}–${Math.max(...allPrices)} KZT`,
  };
  return JSON.parse(JSON.stringify(o));
};
const sameAs = [CONFIG.instagram].filter((u) => /^https:\/\/www\.instagram\.com\/.+/.test(u || ""));
const ld = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  name: D.brand,
  url: url + "/",
  description,
  areaServed: { "@type": "City", name: "Астана" },
  priceRange: `${Math.min(...allPrices)}–${Math.max(...allPrices)} KZT`,
  ...(sameAs.length ? { sameAs } : {}),
  department: D.branches.map(branch),
};

const block = [
  `<meta name="description" content="${esc(description)}">`,
  `<link rel="canonical" href="${url}/">`,
  `<meta name="robots" content="index, follow, max-image-preview:large">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:locale" content="ru_KZ">`,
  `<meta property="og:site_name" content="${esc(D.brand)}">`,
  `<meta property="og:title" content="${esc(title)}">`,
  `<meta property="og:description" content="${esc(description)}">`,
  `<meta property="og:url" content="${url}/">`,
  `<meta name="twitter:card" content="summary">`,
  `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
].map((l) => "  " + l).join("\n");

const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");
const re = /  <!-- seo:start -->[\s\S]*?<!-- seo:end -->/;
if (!re.test(html)) { console.error("В index.html нет меток seo:start / seo:end."); process.exit(1); }
html = html.replace(re, `  <!-- seo:start -->\n${block}\n  <!-- seo:end -->`);
fs.writeFileSync(file, html);

fs.writeFileSync(path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}/</loc></url>\n</urlset>\n`);
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`);
console.log("Готово: index.html, sitemap.xml, robots.txt обновлены для", url);
