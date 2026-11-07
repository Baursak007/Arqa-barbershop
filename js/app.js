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


  /* ---------- Выбор даты и времени ---------- */
  var DAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  var DAY_LONG = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  var MONTH_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var MONTH_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var DAYS_AHEAD = 14;   // на сколько дней вперёд можно записаться
  var STEP_MIN = 30;     // шаг времени
  var LAST_BEFORE_CLOSE = 60; // последняя запись за час до закрытия
  var LEAD_MIN = 30;     // сегодня записываем минимум за 30 минут
  var daysEl = $("#booking-days");
  var slotsEl = $("#booking-slots");
  var slotsHint = $("#slots-hint");
  var summaryEl = $("#booking-summary");

  // Астана живёт по времени UTC+5. Считаем по нему, чтобы «сегодня» не зависело от часового пояса телефона.
  function astanaNow() { return new Date(Date.now() + 5 * 3600 * 1000); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayInfo(offset) {
    var n = astanaNow();
    var d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + offset));
    return { offset: offset, dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear(),
             iso: d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) };
  }
  function branchHours() {
    var b = D.branches.filter(function (x) { return x.name === branchSel.value; })[0];
    var m = b && /(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/.exec(b.hours || "");
    if (!m) return [10 * 60, 21 * 60];
    return [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]];
  }
  function slotsFor(offset) {
    var h = branchHours(), n = astanaNow();
    var nowMin = n.getUTCHours() * 60 + n.getUTCMinutes();
    var out = [];
    for (var t = h[0]; t <= h[1] - LAST_BEFORE_CLOSE; t += STEP_MIN) {
      if (offset === 0 && t < nowMin + LEAD_MIN) continue;
      out.push(pad(Math.floor(t / 60)) + ":" + pad(t % 60));
    }
    return out;
  }
  function chosen(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function renderDays() {
    var keep = chosen("date"), html = "", firstFree = "";
    for (var i = 0; i < DAYS_AHEAD; i++) {
      var d = dayInfo(i), free = slotsFor(i).length > 0;
      if (free && !firstFree) firstFree = d.iso;
      var name = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : DAY_SHORT[d.dow];
      html += '<label class="day' + (d.dow === 0 || d.dow === 6 ? " is-weekend" : "") + '">' +
        '<input type="radio" name="date" value="' + d.iso + '"' + (free ? "" : " disabled") + '>' +
        '<span class="day-name">' + name + '</span><span class="day-num">' + d.day + '</span><span class="day-mon">' + MONTH_SHORT[d.month] + "</span></label>";
    }
    daysEl.innerHTML = html;
    var pick = keep && daysEl.querySelector('input[value="' + keep + '"]:not(:disabled)') ? keep : firstFree;
    var el = pick && daysEl.querySelector('input[value="' + pick + '"]');
    if (el) el.checked = true;
  }
  function renderSlots() {
    var keep = chosen("slot"), iso = chosen("date");
    var off = -1;
    for (var i = 0; i < DAYS_AHEAD; i++) if (dayInfo(i).iso === iso) off = i;
    var list = off < 0 ? [] : slotsFor(off);
    slotsHint.textContent = list.length ? "" : "На эту дату свободного времени нет. Выберите другой день.";
    slotsEl.innerHTML = list.map(function (t) {
      return '<label class="slot"><input type="radio" name="slot" value="' + t + '"><span>' + t + "</span></label>";
    }).join("");
    var el = keep && slotsEl.querySelector('input[value="' + keep + '"]');
    if (el) el.checked = true;
  }
  function whenText() {
    var iso = chosen("date"), slot = chosen("slot");
    if (!iso) return null;
    for (var i = 0; i < DAYS_AHEAD; i++) {
      var d = dayInfo(i);
      if (d.iso === iso) {
        return { date: DAY_LONG[d.dow] + ", " + d.day + " " + MONTH_GEN[d.month] + " " + d.year,
                 short: DAY_SHORT[d.dow] + ", " + d.day + " " + MONTH_GEN[d.month], time: slot };
      }
    }
    return null;
  }
  function renderSummary() {
    var w = whenText();
    summaryEl.textContent = w && w.time
      ? "Запись: " + w.short + " в " + w.time + ", " + branchSel.value
      : "Выберите дату и время, и здесь появится ваша запись.";
    summaryEl.classList.toggle("is-ready", !!(w && w.time));
  }
  function resetPicker() {
    renderDays();
    renderSlots();
    renderSummary();
  }
  form.addEventListener("change", function (e) {
    var n = e.target.name;
    if (n === "date" || n === "branch") { if (n === "branch") renderDays(); renderSlots(); }
    if (n === "date" || n === "slot" || n === "branch") { clearError("date"); clearError("slot"); renderSummary(); }
  });

  /* ---------- Телефон: +7 уже стоит, вводим 10 цифр ---------- */
  var phoneInput = $("#booking-phone");
  function formatPhone(raw) {
    raw = String(raw);
    var d = raw.replace(/\D/g, "");
    // Номера в Казахстане начинаются с 7 (700, 707, 775...), а «8» это старый выход на межгород.
    // Поэтому: «+7...» и «8...» отбрасываем первую цифру, а голую «7» в начале оставляем как часть номера.
    if (/^\s*\+/.test(raw)) d = d.replace(/^7/, "");
    else if (d.charAt(0) === "8") d = d.slice(1);
    else if (d.length > 10 && d.charAt(0) === "7") d = d.slice(1);
    d = d.slice(0, 10);
    var parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
    return parts.join(" ");
  }
  phoneInput.addEventListener("input", function () {
    var raw = phoneInput.value;
    // одинокий «+» оставляем, чтобы после него «7» не посчиталась цифрой номера
    phoneInput.value = raw.trim() === "+" ? "+" : formatPhone(raw);
    clearError("phone");
  });

  function openBooking(branchName) {
    if (branchName) branchSel.value = branchName;
    clearErrors();
    form.hidden = false;
    doneBox.hidden = true;
    $("#done-copy").textContent = "Скопировать текст заявки";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    resetPicker();
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
  function clearError(name) {
    var small = $('[data-error="' + name + '"]', form);
    if (!small) return;
    small.textContent = "";
    small.closest(".field").classList.remove("has-error");
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
    var digits = phoneInput.value.replace(/\D/g, "");
    var phone = "+7 " + formatPhone(phoneInput.value);
    var when = whenText();
    var ok = true;

    if (name.length < 2) { showError("name", "Введите имя."); ok = false; }
    if (digits.length !== 10) { showError("phone", "Введите 10 цифр после +7, например 700 123 45 67."); ok = false; }
    if (!when) { showError("date", "Выберите дату."); ok = false; }
    else if (!when.time) { showError("slot", "Выберите время."); ok = false; }
    if (!form.elements.consent.checked) { showError("consent", "Нужно согласие на обработку данных."); ok = false; }
    if (!ok) {
      var bad = $(".has-error input", form);
      if (bad) bad.focus();
      var badBox = $(".has-error", form);
      if (badBox && badBox.scrollIntoView) badBox.scrollIntoView({ block: "center" });
      return;
    }

    var message = [
      "Здравствуйте! Хочу записаться.",
      "Имя: " + name,
      "Телефон: " + phone,
      "Филиал: " + form.elements.branch.value,
      "Услуга: " + form.elements.service.value,
      "Дата: " + when.date,
      "Время: " + when.time,
    ].join("\n");

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
    resetPicker();
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
  resetPicker();
  $$("[aria-busy]").forEach(function (el) { el.removeAttribute("aria-busy"); });
})();
