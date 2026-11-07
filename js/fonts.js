/*
  Подключает шрифты Google, не задерживая показ страницы.
  Пока шрифт грузится, виден обычный системный (display=swap), потом он плавно заменяется.
  Файл отдельный, потому что политика безопасности (CSP) запрещает скрипты прямо в HTML.
*/
(function () {
  "use strict";
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&family=Unbounded:wght@500;700&display=swap&subset=cyrillic";
  document.head.appendChild(link);
})();
