(function () {
  "use strict";

  var D = SITE_DATA;
  var C = CONFIG;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₸"; }
  function telHref(p) { return "tel:" + String(p).replace(/[^\d+]/g, ""); }
  function icon(name, cls) { return '<svg class="ico' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  var ICONS = { scissors: 1, crown: 1, razor: 1, towel: 1, child: 1, sparkle: 1, user: 1, bottle: 1, cup: 1 };
  function safeIcon(n) { return ICONS[n] ? n : "sparkle"; }

  /* Адрес картинки. В data.js можно указать id фото с Unsplash ("photo-...") или свой файл ("assets/work1.jpg").
     Всё остальное отбрасывается, чтобы посторонний адрес не попал на страницу. */
  function imgUrl(ref, w) {
    ref = String(ref || "");
    if (/^photo-[A-Za-z0-9_-]{6,60}$/.test(ref)) return "https://images.unsplash.com/" + ref + "?auto=format&fit=crop&w=" + w + "&q=75";
    if (/^assets\/[A-Za-z0-9_./-]+\.(jpe?g|png|webp|avif)$/i.test(ref) && ref.indexOf("..") < 0) return ref;
    return "";
  }

  /* Если картинка не загрузилась, остаётся тёмная заготовка вместо значка «битой картинки» */
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG") { t.style.visibility = "hidden"; }
  }, true);

  /* ---------- Простые тексты из data.js ---------- */
  $$("[data-bind]").forEach(function (el) {
    var key = el.getAttribute("data-bind");
    if (D[key] != null) el.textContent = D[key];
  });
  $("#year").textContent = new Date().getFullYear();
  $("#map-link").href = C.map;
  if (/^https:\/\/www\.instagram\.com\/.+/.test(C.instagram || "")) $("#soc-ig").href = C.instagram;
  else $("#soc-ig").hidden = true;
  $("#price-title").textContent = D.priceTitle;
  $("#price-note").textContent = D.priceNote;
  $("#barbers-title").textContent = D.barbersTitle || "";

  var phoneDigits = String(D.mainPhone || "").replace(/\D/g, "");
  if (phoneDigits.length >= 10) {
    var np = $("#nav-phone");
    np.href = telHref(D.mainPhone);
    $("span", np).textContent = D.mainPhone;
    np.hidden = false;
  }

  /* ---------- Статистика и преимущества ---------- */
  $("#stats").innerHTML = (D.stats || []).map(function (s) {
    return "<li><b>" + esc(s.value) + "</b><span>" + esc(s.label) + "</span></li>";
  }).join("");
  $("#advantages").innerHTML = (D.advantages || []).map(function (a) {
    return '<li class="adv"><span class="adv-ico">' + icon(safeIcon(a.icon)) + "</span><div><h3>" + esc(a.title) + "</h3><p>" + esc(a.text) + "</p></div></li>";
  }).join("");

  /* ---------- Услуги ---------- */
  $("#service-grid").innerHTML = D.serviceCards.map(function (c) {
    return (
      '<article class="card service' + (c.hit ? " hit" : "") + '">' +
        (c.hit ? '<span class="ribbon">Хит</span>' : "") +
        "<div><div class=\"service-top\">" + icon(safeIcon(c.icon)) + '<span class="service-price">от ' + money(c.from) + "</span></div>" +
        "<h3>" + esc(c.name) + "</h3><p>" + esc(c.text) + "</p></div>" +
        '<button class="btn ' + (c.hit ? "btn-gold" : "btn-outline") + ' btn-small" type="button" data-book data-note="' + esc("на услугу «" + c.name + "»") + '">Записаться</button>' +
      "</article>"
    );
  }).join("");

  /* ---------- Прайс ---------- */
  (function () {
    var head = '<thead><tr><th scope="col">Услуга</th>' + D.priceColumns.map(function (c) {
      return '<th scope="col">' + esc(c) + "</th>";
    }).join("") + "</tr></thead>";
    var cols = D.priceColumns.length + 1;
    var body = D.priceGroups.map(function (g) {
      var rows = g.rows.map(function (r) {
        return "<tr><td>" + esc(r.name) + "</td>" + r.prices.map(function (p) {
          return "<td>" + money(p) + "</td>";
        }).join("") + "</tr>";
      }).join("");
      return '<tbody><tr class="group"><th colspan="' + cols + '" scope="colgroup">' + esc(g.title) + "</th></tr>" + rows + "</tbody>";
    }).join("");
    $("#price-table").innerHTML = head + body;
  })();

  /* ---------- Галерея ---------- */
  var gImg = $("#gallery-img");
  var gIndex = 0;
  function showGallery(i, instant) {
    var g = D.gallery[i];
    if (!g) return;
    gIndex = i;
    var url = imgUrl(g.img, 1200);
    function apply() {
      gImg.style.visibility = "visible";
      gImg.src = url;
      gImg.alt = g.title;
      $("#gallery-title").textContent = g.title;
      $("#gallery-text").textContent = g.text;
      gImg.classList.remove("out");
    }
    if (instant) apply();
    else { gImg.classList.add("out"); setTimeout(apply, 250); }
    $$(".thumb").forEach(function (t, n) { t.setAttribute("aria-pressed", String(n === i)); });
  }
  $("#thumbs").innerHTML = D.gallery.map(function (g, i) {
    return '<button class="thumb" type="button" data-gallery="' + i + '" aria-pressed="false">' +
      '<img src="' + esc(imgUrl(g.img, 200)) + '" alt="" width="64" height="64" loading="lazy" decoding="async">' +
      "<span><b>" + esc(g.thumb || g.title) + "</b><span>" + esc(g.thumbText || "") + "</span></span></button>";
  }).join("");
  $("#thumbs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gallery]");
    if (b) showGallery(Number(b.getAttribute("data-gallery")));
  });
  showGallery(0, true);

  /* ---------- Мастера ---------- */
  $("#barber-grid").innerHTML = D.barbers.map(function (b) {
    return (
      '<article class="card barber">' +
        "<div><div class=\"barber-photo\"><img src=\"" + esc(imgUrl(b.img, 700)) + '" alt="' + esc(b.name) + '" width="700" height="600" loading="lazy" decoding="async">' +
          (b.rating ? '<span class="rating">' + icon("star") + esc(b.rating) + "</span>" : "") + "</div>" +
        '<div class="barber-body"><p class="barber-role">' + esc(b.role) + "</p><h3>" + esc(b.name) + "</h3><p>" + esc(b.text) + "</p></div></div>" +
        '<button class="btn btn-gold btn-small" type="button" data-book data-note="' + esc("к мастеру " + b.name) + '">Записаться к ' + esc(b.first || b.name) + "</button>" +
      "</article>"
    );
  }).join("");

  /* ---------- Филиалы и фильтр ---------- */
  var activeDistrict = "Все";

  function renderChips() {
    $("#chips").innerHTML = D.districts.map(function (d) {
      return '<button type="button" class="chip" data-district="' + esc(d) + '" aria-pressed="' + (d === activeDistrict) + '">' + esc(d) + "</button>";
    }).join("");
  }

  /* Кнопки карты у филиала. Показываются, только если в data.js указаны ссылка 2ГИС и/или координаты. */
  function mapLinks(b) {
    var out = "";
    if (/^https:\/\/(2gis\.(kz|ru|com)|go\.2gis\.com)\//.test(b.map2gis || "")) {
      out += '<a class="btn btn-outline btn-small" href="' + esc(b.map2gis) + '" target="_blank" rel="noopener">На карте</a>';
    }
    var lat = Number(b.lat), lng = Number(b.lng);
    if (b.lat !== undefined && b.lng !== undefined && isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      out += '<a class="btn btn-outline btn-small" href="https://www.google.com/maps/dir/?api=1&destination=' +
        encodeURIComponent(lat + "," + lng) + '" target="_blank" rel="noopener">Маршрут</a>';
    }
    return out;
  }

  function renderBranches() {
    var list = D.branches.filter(function (b) {
      return activeDistrict === "Все" || b.district === activeDistrict;
    });
    $("#branch-grid").innerHTML = list.map(function (b) {
      return (
        '<article class="branch">' +
          "<h3>" + esc(b.name) + "</h3>" +
          '<p class="branch-meta">' + icon("pin") + "<span>" + esc(b.district) + " · " + esc(b.address) + "</span></p>" +
          '<p class="branch-meta">' + icon("clock") + "<span>" + esc(b.hours) + "</span></p>" +
          '<a class="branch-phone" href="' + telHref(b.phone) + '">' + icon("phone") + esc(b.phone) + "</a>" +
          '<div class="branch-actions">' +
            '<button class="btn btn-gold btn-small" type="button" data-book data-branch="' + esc(b.name) + '">Записаться</button>' +
            mapLinks(b) +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  $("#chips").addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    activeDistrict = btn.getAttribute("data-district");
    renderChips();
    renderBranches();
  });

  /* ---------- Меню на телефоне ---------- */
  var menuBtn = $(".menu-btn");
  var nav = $("#nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }
  menuBtn.addEventListener("click", function () {
    setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a, button")) setMenu(false);
  });

  /* ---------- Запись: кнопки ведут сразу в мессенджер ---------- */
  /* Имя, телефон, филиал, услугу, дату и время клиент выбирает уже в чате (WhatsApp или в боте Telegram).
     Настройки каналов берутся из CONFIG. Значения проверяются, чтобы посторонний текст не попал в ссылку. */
  var dialog = $("#booking");
  var waLink = $("#book-wa");
  var tgLink = $("#book-tg");
  var branchLine = $("#booking-branch-line");

  var waNumber = String(C.whatsapp || "").replace(/\D/g, "");
  var tgName = String(C.telegram || "").trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{3,64}$/.test(tgName)) tgName = "";
  var tgIsBot = C.telegramType !== "user";
  var tgStart = /^[A-Za-z0-9_-]{1,64}$/.test(C.telegramStart || "") ? C.telegramStart : "";
  var available = { whatsapp: waNumber.length >= 10, telegram: tgName !== "" };

  function greeting(branch, note) {
    return "Здравствуйте! Хочу записаться" + (branch ? " в " + branch : "") + (note ? " " + note : "") + ".";
  }
  function waHref(branch, note) {
    return "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(greeting(branch, note));
  }
  function tgHref(branch, note) {
    var base = "https://t.me/" + tgName;
    // У бота Telegram не умеет подставлять текст из ссылки: он откроется с кнопкой «Начать», дальше бот ведёт запись сам.
    if (tgIsBot) return base + (tgStart ? "?start=" + tgStart : "");
    return base + "?text=" + encodeURIComponent(greeting(branch, note));
  }

  waLink.hidden = !available.whatsapp;
  tgLink.hidden = !available.telegram;
  if (!available.whatsapp && !available.telegram) {
    $("#channel-note").textContent = "Онлайн-запись сейчас недоступна. Позвоните в ближайший филиал.";
  }

  function openBooking(branchName, note) {
    var branch = branchName || "";
    note = note || "";
    waLink.href = available.whatsapp ? waHref(branch, note) : "#";
    tgLink.href = available.telegram ? tgHref(branch, note) : "#";
    // если настроен только один канал, лишнее окно не нужно: сразу открываем чат
    if (available.whatsapp !== available.telegram) {
      window.open(available.whatsapp ? waLink.href : tgLink.href, "_blank", "noopener");
      return;
    }
    var shown = [branch ? "Филиал: " + branch : "", note].filter(Boolean).join(" · ");
    branchLine.textContent = shown;
    branchLine.hidden = !shown;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-book]");
    if (trigger) openBooking(trigger.getAttribute("data-branch"), trigger.getAttribute("data-note"));
    if (e.target.closest("[data-close]")) dialog.close();
    if (e.target === dialog) dialog.close(); // клик по затемнению
    if (e.target.closest("[data-chat]")) dialog.close(); // чат открылся в новой вкладке, окно закрываем
  });

  /* ---------- Фото в первом экране и фон меняются при прокрутке ---------- */
  var heroImg = $("#hero-img");
  var heroLabel = $("#hero-label");
  var bgEl = $("#bg-fixed");
  var heroSection = $("#hero");
  var heroFirst = imgUrl(heroSection.getAttribute("data-bg"), 800);
  if (heroFirst) heroImg.src = heroFirst;

  var lastBg = "";
  function swapTo(sec) {
    var ref = sec.getAttribute("data-bg");
    var title = sec.getAttribute("data-bg-title") || "";
    if (ref === lastBg) return;
    lastBg = ref;
    var big = imgUrl(ref, 1200), small = imgUrl(ref, 800);
    if (!big) return;
    bgEl.classList.remove("on");
    setTimeout(function () { bgEl.style.backgroundImage = 'url("' + big + '")'; bgEl.classList.add("on"); }, 250);
    heroImg.classList.add("out");
    setTimeout(function () {
      heroImg.style.visibility = "visible";
      heroImg.src = small;
      heroLabel.textContent = title;
      heroImg.classList.remove("out");
    }, 320);
    var id = sec.getAttribute("id");
    $$(".nav a[href^='#']").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + id); });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) swapTo(en.target); });
    }, { rootMargin: "-15% 0px -35% 0px", threshold: 0.15 });
    $$("section[data-bg]").forEach(function (sec) { io.observe(sec); });

    // нижняя кнопка записи на телефоне появляется, когда первый экран ушёл вверх
    var cta = $(".sticky-cta");
    new IntersectionObserver(function (entries) {
      cta.classList.toggle("show", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(heroSection);
  } else {
    $(".sticky-cta").classList.add("show");
  }

  /* ---------- Лёгкий наклон карточки под курсором (только на устройствах с мышью) ---------- */
  var card = $("#hero-card");
  if (window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      card.style.transform = "perspective(1000px) rotateX(" + (-y / 30) + "deg) rotateY(" + (x / 30) + "deg)";
    });
    card.addEventListener("mouseleave", function () { card.style.transform = ""; });
  }

  /* ---------- Запуск ---------- */
  $("#soc-wa").hidden = !available.whatsapp;
  $("#soc-tg").hidden = !available.telegram;
  if (available.whatsapp) $("#soc-wa").href = waHref("");
  if (available.telegram) $("#soc-tg").href = tgHref("");
  renderChips();
  renderBranches();
  $$("[aria-busy]").forEach(function (el) { el.removeAttribute("aria-busy"); });
})();
