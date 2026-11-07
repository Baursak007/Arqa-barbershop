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
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₸"; }
  function telHref(p) { return "tel:" + p.replace(/[^\d+]/g, ""); }

  /* ---------- Простые тексты из data.js ---------- */
  $$("[data-bind]").forEach(function (el) {
    var key = el.getAttribute("data-bind");
    if (D[key] != null) el.textContent = D[key];
  });
  $("#year").textContent = new Date().getFullYear();
  $("#map-link").href = C.map;
  $("#footer-map").href = C.map;
  $("#footer-ig").href = C.instagram;

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
          '<p class="branch-meta">' + esc(b.district) + " · " + esc(b.address) + "</p>" +
          '<p class="branch-meta">Часы работы: ' + esc(b.hours) + "</p>" +
          '<a class="branch-phone" href="' + telHref(b.phone) + '">' + esc(b.phone) + "</a>" +
          '<div class="branch-actions">' +
            '<button class="btn btn-primary btn-small" type="button" data-book data-branch="' + esc(b.name) + '">Записаться</button>' +
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

  /* ---------- Остальные блоки ---------- */
  function renderIncluded() {
    $("#included-title").textContent = D.includedTitle;
    $("#included-text").textContent = D.includedText;
    $("#included-list").innerHTML = D.included.map(function (i) {
      return "<li><h3>" + esc(i.title) + "</h3><p>" + esc(i.text) + "</p></li>";
    }).join("");
  }

  function renderOffers() {
    $("#offers-title").textContent = D.offersTitle;
    $("#offer-grid").innerHTML = D.offers.map(function (o) {
      return '<article class="offer"><span class="offer-tag">' + esc(o.tag) + "</span><h3>" + esc(o.title) + "</h3><p>" + esc(o.text) + "</p></article>";
    }).join("");
  }

  function renderWhy() {
    $("#why-title").textContent = D.whyTitle;
    $("#why-grid").innerHTML = D.why.map(function (w) {
      return "<div><h3>" + esc(w.title) + "</h3><p>" + esc(w.text) + "</p></div>";
    }).join("");
  }

  function renderPrices() {
    $("#price-title").textContent = D.priceTitle;
    $("#price-note").textContent = D.priceNote;
    var head = '<thead><tr><th scope="col">Услуга</th>' + D.priceColumns.map(function (c) {
      return '<th scope="col">' + esc(c) + "</th>";
    }).join("") + "</tr></thead>";
    var cols = D.priceColumns.length + 1;
    var body = D.priceGroups.map(function (g) {
      var rows = g.rows.map(function (r) {
        return '<tr><td>' + esc(r.name) + "</td>" + r.prices.map(function (p) {
          return "<td>" + money(p) + "</td>";
        }).join("") + "</tr>";
      }).join("");
      return '<tbody><tr class="group"><th colspan="' + cols + '" scope="colgroup">' + esc(g.title) + "</th></tr>" + rows + "</tbody>";
    }).join("");
    $("#price-table").innerHTML = head + body;
  }

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

  function greeting(branch) {
    return "Здравствуйте! Хочу записаться" + (branch ? " в " + branch : "") + ".";
  }
  function waHref(branch) {
    return "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(greeting(branch));
  }
  function tgHref(branch) {
    var base = "https://t.me/" + tgName;
    // У бота Telegram не умеет подставлять текст из ссылки: он откроется с кнопкой «Начать», дальше бот ведёт запись сам.
    if (tgIsBot) return base + (tgStart ? "?start=" + tgStart : "");
    return base + "?text=" + encodeURIComponent(greeting(branch));
  }

  waLink.hidden = !available.whatsapp;
  tgLink.hidden = !available.telegram;
  if (!available.whatsapp && !available.telegram) {
    $("#channel-note").textContent = "Онлайн-запись сейчас недоступна. Позвоните в ближайший филиал.";
  }

  function openBooking(branchName) {
    var branch = branchName || "";
    waLink.href = available.whatsapp ? waHref(branch) : "#";
    tgLink.href = available.telegram ? tgHref(branch) : "#";
    // если настроен только один канал, лишнее окно не нужно: сразу открываем чат
    if (available.whatsapp !== available.telegram) {
      window.open(available.whatsapp ? waLink.href : tgLink.href, "_blank", "noopener");
      return;
    }
    branchLine.textContent = branch ? "Филиал: " + branch : "";
    branchLine.hidden = !branch;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-book]");
    if (trigger) openBooking(trigger.getAttribute("data-branch"));
    if (e.target.closest("[data-close]")) dialog.close();
    if (e.target === dialog) dialog.close(); // клик по затемнению
    if (e.target.closest("[data-chat]")) dialog.close(); // чат открылся в новой вкладке, окно закрываем
  });

  /* ---------- Запуск ---------- */
  renderChips();
  renderBranches();
  renderIncluded();
  renderOffers();
  renderWhy();
  renderPrices();
  $$("[aria-busy]").forEach(function (el) { el.removeAttribute("aria-busy"); });
})();
