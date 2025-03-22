const express = require('express');                 // Фреймворк для создания веб-приложений на Node.js
const bodyParser = require('body-parser');         // Для обработки данных, отправленных в теле HTTP-запроса
const cors = require('cors');                      // Для разрешения запросов с других доменов
const path = require('path');                      // Модуль для работы с путями к файлам и директориям
const session = require('express-session');        // Для управления сессиями пользователей
const sqlite3 = require('sqlite3').verbose();      // Модуль для работы с БД SQLite3
const bcrypt = require('bcrypt');                  // Модуль для хэширования пароля

// Инициализация приложения и БД
const app = express();
const port = 3000;

// Создание БД и таблицы пользователей
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    // Добавляем колонки в БД
    db.run (`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            password TEXT NOT NULL,                 
            phone TEXT,
            email TEXT UNIQUE
        )
        
        `, (err) => {
            if (err) {
                console.error('Ошибка при создании таблицы:', err.message);
            } else {
                console.log('Таблица users успешно создана или существует.');
            }
        });

        // Проверяем, существует ли колонка role
        db.all("PRAGMA table_info(users)", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении информации о таблице', err.message);
                return;
            }

            const hasRoleColumn = rows.some(row => row.name === 'role');
            if (!hasRoleColumn) {
                // Добавляем колонку role, если ее нет
                db.run('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"', (err) => {
                    if (err) {
                        console.error('Ошибка при добавлении колонки role:', err.message);
                    } else {
                        console.log('Колонка role успешно добавлена.');
                    }
                });
            }
        });

        // Проверяем, существует ли колонка work_time
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
            console.error('Ошибка при получении информации о таблице', err.message);
            return;
        }

        const hasWorkTimeColumn = rows.some(row => row.name === 'work_time');
        if (!hasWorkTimeColumn) {
            // Добавляем колонку work_time, если её нет
            db.run('ALTER TABLE users ADD COLUMN work_time TEXT', (err) => {
                if (err) {
                    console.error('Ошибка при добавлении колонки work_time:', err.message);
                } else {
                    console.log('Колонка work_time успешно добавлена.');
                }
            });
        }
    });
        // Устанавливаем роль admin для пользователя с именем "admin"
        db.run('UPDATE users SET role = "admin" WHERE full_name = "admin"', (err) => {
            if (err) {
                console.error('Ошибка при установке роли admin:', err.message);
            } else {
                console.log('Роль admin успешно установлена для пользователя admin.');
            }
        });
});

// Настройка сессий
app.use(session({
    secret: '603492175',                // Секретный ключ для подписи сессий
    resave: false,
    saveUninitialized: true,
}));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Проверка авторизации
const requireAuth = (req, res, next) => {
    if (req.session.loggedIn) {
        next(); // Пользователь авторизован
    } else {
        res.redirect('/src');
    }
}

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, '..', 'src')));
app.use(express.static(path.join(__dirname, '..', 'register')));
app.use(express.static(path.join(__dirname, '..', 'timer')));
app.use(express.static(path.join(__dirname, '..', 'table')));

// Маршруты для статических страниц
// Маршурт для корневого страницы входа
app.get('/src', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'src', 'index.html'));
});

// Маршурт для регистрации
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../register/register.html'));
});

// Маршрут для таймера
app.get('/timer', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'timer', 'timer.html'));
})

// Проверка роли администратора
const requireAdmin = (req, res, next) => {
    if (req.session.role = 'admin') {
        next(); // Пользователь admin
    } else {
        res.status(403).send('Доступ запрещен');  // Запрет доступа
    }
};

app.get('/table.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname), '..', 'table', 'table.html');
})

// Маршрут для получения всех пользователей
app.get('/api/users', (req, res) => {
    db.all('SELECT full_name, phone, email, password, work_time FROM users WHERE role != "admin"', (err, rows) => {
        if (err) {
            console.error('Ошибка при получении пользователей', err);
            return res.status(500).send({ success: false, message: 'Ошибка при получении данных'});
        }
        res.send({ success: true, users: rows});
    });
});

// Маршрут для получения текущего пользователя
app.get('/get-current-user', (req, res) => {
    if (req.session.loggedIn) {
        res.send({ success: true, email: req.session.email });      // Возвращает email текущего пользователя,
    } else {                                                        // есл он авторизован
        res.status(401).send({ success: false, message: 'Пользователь не авторизован'});
    }
})

// Маршрут для обновления времени работы
app.post('/update-work-time', (req, res) => {
    const { email, work_time } = req.body;

    // Проверяем, авторизован ли пользователь
    if (!req.session.loggedIn || req.session.email !== email) {
        return res.status(403).send({ success: false, message: 'Доступ запрещен' });
    }

    // Обновляем время работы в базе данных
    db.run(
        'UPDATE users SET work_time = ? WHERE email = ?',
        [work_time, email],
        function(err) {
            if (err) {
                console.error('Ошибка при обновлении времени работы:', err);
                return res.status(500).send({ success: false, message: 'Ошибка при обновлении времени работы' });
            }
            res.send({ success: true, message: 'Время работы обновлено' });
        }
    );
});

// Маршрут для входа
app.post('/src', async (req, res) => {
    const { full_name, password } = req.body;

    db.get('SELECT * FROM users WHERE full_name = ?', [full_name], async (err, row) => {
        if (err) {
            res.status(500).send({ success: false, message: 'Ошибка БД' });
        }

        if (!row) {
            return res.status(401).send({ success: false, message: 'Неверные учетные данные' });
        }

        // Сравниваем введенный пароль с хэшем из БД
        const isPasswordValid = await bcrypt.compare(password, row.password);

        // Проверяем пароль
        if (isPasswordValid) {
            req.session.loggedIn = true;
            req.session.full_name = full_name;
            req.session.email = row.email;
            req.session.role = row.role; // Сохраняем роль в сессии

            if (row.role === 'admin') {
                // Перенаправляем админа на страницу с таблицей
                res.send({ success: true, message: 'Вход в систему прошел успешно', redirect: '/table.html'});
            } else {
                // Перенаправляем обычного пользователя на другую страницу
                res.send({ success: true, message: 'Вход в систему прошел успешно', redirect: '/timer.html'});
            }
        } else {
            res.status(401).send({ success: false, message: 'Неверные учетные данные' });
        }
    });
});

// Маршрут для регистрации
app.post('/register', async (req, res) => {
    const { full_name, phone, email, password } = req.body;

    // Проверяем, существует ли пользователь с таким email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
            console.log('Ошибка при поиске пользователя', err);
            return res.status(500).send({ success: false, message: 'Ошибка БД' });
        }

        if (row) {
            console.log('Пользователь с таким email уже существует', email);
            return res.status(400).send({ success: false, message: 'Пользователь с таким email уже существует' });
        }

        // Хэшируем пароль
        const saltRounds = 10; // Кол-во раундов хэширования
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Если пользователь с таким email не существует, добавляем нового пользователя
        db.run(
            'INSERT INTO users (full_name, phone, email, password, role) VALUES (?, ?, ?, ?, "user")',
            [full_name, phone, email, hashedPassword], // Используем hashedPassword, вместо password
            function(err) {
                if (err) {
                    console.log('Ошибка при регистрации пользователя', err);
                    return res.status(500).send({ success: false, message: 'Ошибка при регистрации пользователя' });
                }
                console.log('Пользователь успешно зарегистрирован', this.lastID);
                res.send({ success: true, message: 'Пользователь успешно зарегистрирован', userId: this.lastID });
            }
        );
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
})