# GitHub: как выложить сайт и работать с репозиторием

## Что это такое (за минуту)
- **Git** — программа на твоём компьютере, которая запоминает версии файлов.
- **GitHub** — сайт, где эти версии хранятся в интернете. Там же можно бесплатно опубликовать сайт (GitHub Pages).
- **Репозиторий (репо)** — папка проекта вместе с историей изменений.
- **Коммит** — сохранённый снимок проекта с подписью, что изменилось.

## Один раз: подготовка
1. Зарегистрируйся на https://github.com (если ещё нет аккаунта).
2. Установи Git: https://git-scm.com/downloads
3. Открой терминал (в Windows это Git Bash, который ставится вместе с Git) и представься:
   ```bash
   git config --global user.name "Твоё Имя"
   git config --global user.email "почта@которая-на-github.com"
   ```

## Шаг 1. Создай репозиторий на GitHub
1. Нажми **+ → New repository**.
2. Name: `barbershop-site` (латиницей, без пробелов).
3. Public (для бесплатного GitHub Pages).
4. **Не** ставь галочки «Add a README» и «.gitignore», они уже есть в проекте.
5. Нажми **Create repository**. Страница покажет адрес вида `https://github.com/ТВОЙ_НИК/barbershop-site.git`.

## Шаг 2. Загрузи проект
Открой терминал **внутри папки `barbershop-site`** и выполни по очереди:
```bash
git init
git add .
git commit -m "Первая версия сайта"
git branch -M main
git remote add origin https://github.com/ТВОЙ_НИК/barbershop-site.git
git push -u origin main
```
При первом `push` GitHub попросит войти. Пароль от аккаунта не подойдёт: нужен **токен** (Settings → Developer settings → Personal access tokens) или вход через браузер, который предложит Git. Проще всего установить GitHub Desktop (https://desktop.github.com) и войти в него один раз.

## Шаг 3. Включи публикацию (GitHub Pages)
1. В репозитории: **Settings → Pages**.
2. Source: **Deploy from a branch**.
3. Branch: **main**, папка **/ (root)**, нажми **Save**.
4. Через 1-2 минуты сайт откроется по адресу `https://ТВОЙ_НИК.github.io/barbershop-site/`. Эту ссылку можно показывать клиенту.

## Как вносить изменения (каждый день)
```bash
git status                       # что изменилось
git add .                        # подготовить все изменения
git commit -m "Обновил цены"     # сохранить снимок с подписью
git push                         # отправить на GitHub, сайт обновится сам
```
Правило: один коммит — одна понятная правка. Подпись пиши по-человечески: «Добавил филиал», «Поменял цвета».

## Полезные команды
| Что нужно | Команда |
|---|---|
| Посмотреть историю | `git log --oneline` |
| Отменить правки в файле, которые ещё не закоммичены | `git restore имя_файла` |
| Скачать свежую версию с GitHub | `git pull` |
| Скачать чужой репозиторий | `git clone ссылка` |

## Работа с ветками (когда захочешь пробовать без риска)
```bash
git switch -c new-design        # создать ветку и перейти в неё
# ...правишь, коммитишь...
git push -u origin new-design   # отправить ветку
```
На GitHub появится кнопка **Compare & pull request**. Когда результат устраивает, нажимаешь **Merge**, и правки попадают в `main`.

## Безопасность
- Никогда не коммить пароли, токены и ключи (`.env` уже в `.gitignore`). Если ключ попал в репозиторий, считай его украденным и перевыпусти.
- Номер телефона в `CONFIG` публичный: он виден всем, кто откроет сайт. Для этого проекта так и задумано.
- **Где хранится токен.** Команда `git config --global credential.helper store` сохраняет токен в файле `~/.git-credentials` **открытым текстом**. Это удобно, но любой, кто получит доступ к твоей папке или резервной копии, получит и токен. Лучше так:
  - ставь токену срок действия (30-90 дней) и минимальные права (`repo`), а когда срок вышел, выпускай новый;
  - вместо `store` включи кэш в памяти: `git config --global credential.helper 'cache --timeout=3600'`. Токен хранится в памяти час и на диск не пишется, а по истечении времени Git попросит ввести его снова;
  - если хочешь хранить токен надёжно и постоянно, используй связку ключей системы (в Linux Mint это `libsecret`). Обычный рецепт для Ubuntu и Mint: `sudo apt install libsecret-1-dev gnome-keyring make gcc`, затем `cd /usr/share/doc/git/contrib/credential/libsecret && sudo make`, затем `git config --global credential.helper /usr/share/doc/git/contrib/credential/libsecret/git-credential-libsecret`. Эту цепочку я здесь не запускал, поэтому после настройки проверь, что `git push` работает;
  - если уже использовал `store`: удали файл командой `rm ~/.git-credentials`, а старый токен удали на GitHub (Settings → Developer settings → Personal access tokens → Delete).
- **Email в коммитах.** Git подписывает коммиты твоим email, а в публичном репозитории его видит любой. Включи на GitHub **Settings → Emails → Keep my email addresses private** и **Block command line pushes that expose my email**, а в Git укажи адрес вида `ТВОЙ_НИК@users.noreply.github.com`: `git config --global user.email "ТВОЙ_НИК@users.noreply.github.com"`. Точный адрес показан на той же странице Settings → Emails.
- **Заголовки безопасности.** GitHub Pages не даёт настраивать HTTP-заголовки. В `index.html` задана политика безопасности через `<meta>`, а защиту от встраивания сайта в чужую страницу и полный набор заголовков можно получить, если поставить перед сайтом Cloudflare.

## Для каждого клиента
Делай отдельный репозиторий: скопируй папку, поменяй `js/data.js`, создай новое репо и повтори шаги 1-3. Когда клиент захочет свой домен (например, `arqa.kz`), его подключают в **Settings → Pages → Custom domain**.
