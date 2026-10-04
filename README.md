# FILM!

## Установка

### PostgreSQL

Установите и запустите PostgreSQL. Подготовьте базу `film_db` и пользователя `film_user` с доступом к ней. Структура таблиц описана в `backend/test/prac.init.sql`, начальные данные — в `backend/test/prac.films.sql` и `backend/test/prac.shedules.sql`.

Поля `tags` и `taken` хранятся в текстовых колонках и преобразуются TypeORM в `string[]` через `simple-array`. Существующие SQL-данные не требуют миграции; элементы массивов не должны содержать запятые.

### Бэкенд

Перейдите в папку с исходным кодом бэкенда

`cd backend`

Установите зависимости (точно такие же, как в package-lock.json) помощью команд

`npm ci` или `yarn install --frozen-lockfile`

Создайте `.env` файл из примера `.env.example`, в нём укажите:

* `DATABASE_DRIVER` — `postgres`.
* `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME` — адрес, порт и имя базы.
* `DATABASE_USERNAME`, `DATABASE_PASSWORD` — учётные данные пользователя PostgreSQL.
* `DATABASE_URL` — альтернативный адрес подключения, например `postgresql://127.0.0.1:5432/film_db`. При использовании URL удалите `DATABASE_HOST`, `DATABASE_PORT` и `DATABASE_NAME` из `.env`, чтобы они не переопределяли параметры URL.

Настройки подключения загружает `ConfigModule`; TypeORM получает их через `ConfigService`. Автоматическое изменение схемы базы при запуске отключено.

Запустите бэкенд:

`npm run start:debug`

Для проверки отправьте тестовый запрос с помощью Postman или `curl`.

### Проверки бэкенда

Из каталога `backend`:

```bash
npm run lint
npm run build
npm test -- --runInBand
```

Для интеграционных тестов нужна запущенная PostgreSQL и отдельная тестовая база. Укажите её URL; пользователь должен иметь право создавать схемы:

```bash
TEST_DATABASE_URL=postgresql://film_test:film_test@127.0.0.1:5432/film_test npm run test:e2e -- --runInBand
```

Тесты создают отдельную схему со случайным именем и удаляют её после выполнения. Они проверяют получение фильмов и расписаний, заказ нескольких билетов, полный откат при конфликте или ошибке записи, а также одновременное бронирование.



