# FILM! — деплой сервиса

React + TypeScript + NestJS + PostgreSQL. Сервис показывает фильмы и расписание, оформляет заказы и защищает места от одновременного бронирования.

## Публичное приложение

Удалённый сервер и домен ещё не настроены. Перед отправкой на ревью здесь должна быть проверенная ссылка на работающий сайт. Локальный адрес ниже не заменяет публичный деплой.

## Запуск через Docker

Нужны Docker Engine / Docker Desktop и Docker Compose v2.

```bash
cp .env.example .env
# Задайте свои DATABASE_PASSWORD, PGADMIN_EMAIL и PGADMIN_PASSWORD в .env.
docker compose up -d --build
docker compose ps -a
```

Приложение: [http://localhost](http://localhost). pgAdmin: [http://localhost:8080](http://localhost:8080).

При первом запуске PostgreSQL автоматически выполняет `backend/test/prac.init.sql`, `prac.films.sql`, `prac.shedules.sql`: создаёт таблицы, 6 фильмов и расписание. Скрипты выполняются только для нового тома базы. При обычном обновлении данные сохраняются. `docker compose down` останавливает проект; добавление `--volumes` удалит данные.

Сервисы:

| Сервис | Назначение |
| --- | --- |
| `database` | PostgreSQL, постоянный том `database_data`, проверка готовности |
| `backend` | Production-код NestJS из `dist`, только production-зависимости, непривилегированный пользователь |
| `frontend` | Собирает React и копирует готовые файлы в том `frontend_dist`, затем завершается с кодом 0 |
| `nginx` | Раздаёт том фронтенда, проксирует `/api/` и `/content/`, поддерживает SPA fallback |
| `pgadmin` | Администрирование базы, постоянный том `pgadmin_data`, порт доступен только с localhost |

У всех сервисов задана политика перезапуска. `frontend` — одноразовый сервис с `restart: on-failure`; остальные используют `unless-stopped`. Бэкенд стартует после готовности PostgreSQL, nginx — после готовности бэкенда и публикации файлов фронтенда. В финальных образах приложения нет TypeScript-исходников и dev-зависимостей.

Для подключения в pgAdmin укажите хост `database`, порт `5432`, имя базы и пользователя из `.env`. База не публикует порт на хост.

## Настройки

Docker Compose читает корневой `.env`, пример — `.env.example`. Для запуска без Docker используйте `backend/.env.example` и `frontend/.env.example`.

| Переменная | Назначение |
| --- | --- |
| `COMPOSE_PROJECT_NAME` | Имя стека и префикс его томов |
| `REGISTRY_IMAGE_PREFIX` | Префикс образов, например `ghcr.io/fren4okolate/film-react-nest` |
| `IMAGE_TAG` | Тег образов: `review-2`, `main`, `latest` или `sha-…` |
| `HTTP_BIND_ADDRESS` | Адрес привязки nginx: `0.0.0.0` для прямого доступа или `127.0.0.1` за nginx хоста |
| `HTTP_PORT` | Внешний HTTP-порт nginx, по умолчанию 80 |
| `NODE_ENV`, `PORT` | Режим и внутренний порт бэкенда |
| `LOGGER_FORMAT` | `dev`, `json` или `tskv`; без настройки в production используется JSON |
| `DATABASE_DRIVER` | `postgres` |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME` | Параметры PostgreSQL; в Compose хост — `database` |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Учётные данные базы |
| `DATABASE_URL` | Необязательный URL подключения; явно заданные отдельные настройки имеют приоритет |
| `VITE_API_URL`, `VITE_CDN_URL` | Адреса API и изображений, в Docker относительные; применяются при сборке фронтенда |
| `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`, `PGADMIN_PORT` | Учётные данные pgAdmin и локальный порт |
| `TEST_DATABASE_URL` | URL отдельной базы для интеграционных тестов, задаётся при их запуске |

Секреты не добавляются в Git. Все настройки приложения загружаются через `ConfigModule` / `ConfigService`. `synchronize` отключён. `tags` и `taken` преобразуются TypeORM в массивы через `simple-array`, поэтому элементы не должны содержать запятые.

## Логирование

`DevLogger` сохраняет стандартный вывод NestJS. `JsonLogger` выводит одну JSON-запись на строку. `TSKVLogger` выводит плоские поля через табуляцию и экранирует управляющие символы, `=` и `\`. Оба структурированных логгера поддерживают `log`, `error`, `warn`, `debug`, `verbose`, `fatal`, сообщения-объекты, ошибки и дополнительные параметры.

```text
{"level":"log","message":"Started","optionalParams":["Bootstrap"]}
tskv<TAB>level=log<TAB>message=Started<TAB>optionalParams=["Bootstrap"]
```

В TSKV-примере `<TAB>` обозначает настоящий символ табуляции. Логи HTTP содержат метод, путь, код ответа и длительность; тело заказа и контактные данные в них не записываются. При старте используется `bufferLogs`, затем выбранный через DI логгер подключается через `app.useLogger`.

```bash
docker compose logs -f backend
```

## Локальная разработка и проверки

Node.js 22, npm. Установка зависимостей:

```bash
npm --prefix backend ci
npm --prefix frontend ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Для разработки укажите в `backend/.env` доступную PostgreSQL. Сначала создайте пользователя и базу, затем в выбранной базе выполните SQL-файлы из `backend/test` в порядке `init`, `films`, `shedules`.

```bash
npm --prefix backend run start:dev
npm --prefix frontend run dev
```

Проверки из корня:

```bash
npm run lint
npm run build
npm test
TEST_DATABASE_URL=postgresql://film_test:film_test@localhost:5432/film_test npm run test:e2e
npm run test:deploy -- http://localhost
```

Юнит-тесты проверяют форматирование и вывод логгеров, выбор формата, HTTP-маршруты контроллеров, валидацию заказов и логику бронирования. Интеграционные тесты используют PostgreSQL и отдельную схему со случайным именем, которую удаляют после завершения. Они проверяют откат заказов и конкурентное бронирование. Проверка `test:deploy` проверяет весь стек, прокси, изображения и SPA-роутинг, не бронируя места.

## GitHub Actions и образы

`.github/workflows/tests.yml` запускает линтеры, тесты, сборки и проверку Docker Compose. На push в `main` или `review-2` после успешных проверок публикуются образы:

- `ghcr.io/fren4okolate/film-react-nest-backend`
- `ghcr.io/fren4okolate/film-react-nest-frontend`
- `ghcr.io/fren4okolate/film-react-nest-nginx`

Используются `GITHUB_TOKEN` и разрешение `packages: write`. Образы собираются для `linux/amd64` и `linux/arm64`. Теги: имя ветки и `sha-…`; `latest` обновляется только из `main`. Для PR выполняются проверки без публикации. Публикация из `review-2` позволяет развернуть проект до принятия работы без изменений в `main`.

## Удалённый сервер

1. Создайте Linux-сервер, установите Docker с Compose v2, настройте SSH и DNS-запись домена на IP сервера. Откройте входящие 22 и 80; 443 понадобится для HTTPS.
2. Скопируйте проект на сервер или клонируйте ветку `review-2`. Для запуска готовых образов достаточно `docker-compose.yml`, `.env`, `deploy/update.sh` и трёх SQL-файлов из `backend/test` с сохранением структуры каталогов.
3. Создайте `.env` по примеру, замените пароли и укажите `IMAGE_TAG` опубликованной версии. Для приватных GHCR-образов предварительно выполните `docker login ghcr.io` с токеном, имеющим `read:packages`; для публичных образов авторизация не нужна.
4. После завершения GitHub Actions выполните `sh deploy/update.sh`. Скрипт скачивает образы и запускает их с `--no-build`, обновляет том фронтенда и ждёт готовности сервисов.
5. Проверьте `docker compose ps -a`, открытие сайта, выбор фильма и оформление заказа; запустите `node deploy/smoke.mjs http://ВАШ-ДОМЕН` с машины, где установлен Node.js.
6. Вставьте фактическую ссылку в раздел «Публичное приложение» и проверьте её перед сдачей.

pgAdmin на сервере доступен через SSH-туннель:

```bash
ssh -L 8080:127.0.0.1:8080 USER@SERVER
```

После этого откройте `http://localhost:8080`. Для обновления укажите новый тег в `.env` и повторите `sh deploy/update.sh`. Для возврата к предыдущей версии укажите её `sha-…` тег; том PostgreSQL сохраняется.

Если на сервере уже работает nginx с другими сайтами, задайте в `.env` `HTTP_BIND_ADDRESS=127.0.0.1` и свободный `HTTP_PORT`, например `8081`. Контейнер будет доступен только локально. Шаблон `deploy/nginx-host.conf.template` описывает отдельный виртуальный хост: подставьте в него `APP_DOMAIN` и `HTTP_PORT` через `envsubst '${APP_DOMAIN} ${HTTP_PORT}'`, разместите результат в конфигурации nginx хоста и проверьте `nginx -t` перед перезагрузкой конфигурации. Для HTTP-проверки сертификата предусмотрен каталог `/var/www/film-acme`.

HTTPS и отдельный поддомен API можно подключить после выбора домена. Текущая конфигурация использует единый origin и путь `/api/afisha`.
