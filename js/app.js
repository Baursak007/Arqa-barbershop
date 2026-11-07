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
          '<button class="btn btn-primary btn-small" type="button" data-book data-branch="' + esc(b.name) + '">Записаться</button>' +
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

  /* ---------- Окно записи ---------- */
  var dialog = $("#booking");
  var form = $("#booking-form");
  var branchSel = $("#booking-branch");
  var serviceSel = $("#booking-service");
  var doneBox = $("#booking-done");
  var lastChannel = "";

  /* Настройки каналов из CONFIG. Значения проверяются, чтобы посторонний текст не попал в ссылку. */
  var waNumber = String(C.whatsapp || "").replace(/\D/g, "");
  var tgName = String(C.telegram || "").trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{3,64}$/.test(tgName)) tgName = "";
  var tgIsBot = C.telegramType !== "user";
  var tgStart = /^[A-Za-z0-9_-]{1,64}$/.test(C.telegramStart || "") ? C.telegramStart : "";
  var available = { whatsapp: waNumber.length >= 10, telegram: tgName !== "" };

  branchSel.innerHTML = D.branches.map(function (b) {
    return '<option value="' + esc(b.name) + '">' + esc(b.name) + "</option>";
  }).join("");
  serviceSel.innerHTML = D.services.map(function (s) {
    return '<option value="' + esc(s) + '">' + esc(s) + "</option>";
  }).join("");
  // показываем только те каналы, которые настроены
  $$("[data-channel]", form).forEach(function (btn) {
    btn.hidden = !available[btn.getAttribute("data-channel")];
  });
  if (!available.whatsapp && !available.telegram) {
    $("#channel-note").textContent = "Онлайн-запись сейчас недоступна. Позвоните в ближайший филиал.";
  }

  function openBooking(branchName) {
    if (branchName) branchSel.value = branchName;
    clearErrors();
    form.hidden = false;
    doneBox.hidden = true;
    $("#done-copy").textContent = "Скопировать текст заявки";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    var first = $("input[name=name]", form);
    if (first) first.focus();
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-book]");
    if (trigger) openBooking(trigger.getAttribute("data-branch"));
    if (e.target.closest("[data-close]")) dialog.close();
    if (e.target === dialog) dialog.close(); // клик по затемнению
  });

  function clearErrors() {
    $$(".field", form).forEach(function (f) { f.classList.remove("has-error"); });
    $$("[data-error]", form).forEach(function (s) { s.textContent = ""; });
  }
  function showError(name, text) {
    var small = $('[data-error="' + name + '"]', form);
    if (!small) return;
    small.textContent = text;
    small.closest(".field").classList.add("has-error");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var digits = phone.replace(/\D/g, "");
    var ok = true;

    if (name.length < 2) { showError("name", "Введите имя."); ok = false; }
    if (digits.length < 10) { showError("phone", "Введите номер полностью, например +7 700 123 45 67."); ok = false; }
    if (!ok) { var bad = $(".has-error input", form); if (bad) bad.focus(); return; }

    var lines = [
      "Здравствуйте! Хочу записаться.",
      "Имя: " + name,
      "Телефон: " + phone,
      "Филиал: " + form.elements.branch.value,
      "Услуга: " + form.elements.service.value,
    ];
    var when = form.elements.time.value.trim();
    if (when) lines.push("Удобное время: " + when);
    var message = lines.join("\n");

    // какую кнопку нажал клиент
    var channel = (e.submitter && e.submitter.getAttribute("data-channel")) || lastChannel;
    if (!available[channel]) channel = available.whatsapp ? "whatsapp" : (available.telegram ? "telegram" : "");
    if (!channel) return;

    if (channel === "whatsapp") {
      var waUrl = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(message);
      window.open(waUrl, "_blank", "noopener");
      showDone({
        title: "Осталось отправить сообщение",
        text: "В WhatsApp нажмите «Отправить», и заявка дойдёт до администратора. Если чат не открылся, нажмите кнопку ниже.",
        url: waUrl, linkLabel: "Открыть WhatsApp", showMessage: false,
      });
    } else if (!tgIsBot) {
      // личный аккаунт: Telegram сам подставляет текст из ссылки
      var tgUserUrl = "https://t.me/" + tgName + "?text=" + encodeURIComponent(message);
      window.open(tgUserUrl, "_blank", "noopener");
      showDone({
        title: "Осталось отправить сообщение",
        text: "В Telegram нажмите «Отправить», и заявка дойдёт до администратора. Если чат не открылся, нажмите кнопку ниже.",
        url: tgUserUrl, linkLabel: "Открыть Telegram", showMessage: false,
      });
    } else {
      // бот: ссылка не умеет подставлять текст, поэтому копируем заявку, а клиент вставляет её в чат
      var tgBotUrl = "https://t.me/" + tgName + (tgStart ? "?start=" + tgStart : "");
      window.open(tgBotUrl, "_blank", "noopener");
      showDone({
        title: "Вставьте заявку в чат",
        text: "В Telegram нажмите «Запустить» (Start), затем вставьте текст заявки и отправьте его боту.",
        url: tgBotUrl, linkLabel: "Открыть Telegram", showMessage: true, message: message,
      });
      copyText(message).then(function (ok) {
        $("#done-text").textContent = ok
          ? "Текст заявки уже скопирован. В Telegram нажмите «Запустить» (Start), затем вставьте текст в сообщение и отправьте его боту."
          : "В Telegram нажмите «Запустить» (Start). Скопируйте текст заявки ниже, вставьте его в сообщение и отправьте боту.";
      });
    }
    form.reset();
  });

  form.addEventListener("click", function (e) {
    var b = e.target.closest("[data-channel]");
    if (b) lastChannel = b.getAttribute("data-channel");
  });

  function copyText(text) {
    try {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    } catch (err) {
      return Promise.resolve(false);
    }
  }

  function showDone(o) {
    form.hidden = true;
    doneBox.hidden = false;
    $("#done-title").textContent = o.title;
    $("#done-text").textContent = o.text;
    var link = $("#done-link");
    link.setAttribute("href", o.url);
    link.textContent = o.linkLabel;
    $("#done-message-field").hidden = !o.showMessage;
    $("#done-copy").hidden = !o.showMessage;
    if (o.showMessage) $("#done-message").value = o.message;
  }

  $("#done-copy").addEventListener("click", function () {
    var btn = this;
    copyText($("#done-message").value).then(function (ok) {
      btn.textContent = ok ? "Текст скопирован" : "Выделите текст выше и скопируйте вручную";
    });
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
