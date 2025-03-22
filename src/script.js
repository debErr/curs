document.getElementById('inForm').addEventListener('submit', async(e) => {
    e.preventDefault();         // Отменяем стандартное поведение формы (перезагрузку страницы),
                               // чтобы можно было обработать данные ассинхронно с помощью JS

    const full_name = document.getElementById('name').value;        // Получение данных из формы
    const password = document.getElementById('password').value;

    // Отправка данных на сервер
    const response = await fetch('/src', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name, password }),
    });

    // Обработка ответа от сервера
    const result = await response.json();

    if (response.ok) {
        // Перенаправляем пользователя в зависимости от роли
        window.location.href = result.redirect;
    } else {
        // Проверяем, связано ли сообщение об ошибке с отсутствием пользователя
        if (result.message === 'Неверные учетные данные') {
            // Если пользователь не найдет, перенаправляем его на страницу регистрации
            window.location.href = '/register';
        } else {
            // В других случаях (например, ошибка сервера) показываем сообщение об ошибке
            alert(result.message || 'Ошибка при входе в систему');
        }
    }
});