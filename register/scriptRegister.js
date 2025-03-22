document.getElementById('registerForm').addEventListener('submit', async(e) => {
    e.preventDefault();

    const full_name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ full_name, phone, email, password }),
        });
    
        const result = await response.json();
        document.getElementById('message').textContent = result.message;
    
        if (response.ok) {
            console.log('Регистрация прошла успешно, перенаправление на /src')
            window.location.href = '/src';
        } else {
            console.log('Ошибка регистрации', result.message);
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
    }
});

// Функция для применения маски для телефона
function applyPhoneMask(input) {
    // Убираем все нецифровые символы
    let value = input.value.replace(/\D/g, '');

    // Ограничиваем длину номера 11 цифрами
    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    // Форматируем номер в маску
    let formattedValue = '+7';
    if (value.length > 1) {
        formattedValue += ' (' + value.slice(1, 4);
    }
    if (value.length > 4) {
        formattedValue += ') ' + value.slice(4, 7);
    }
    if (value.length > 7) {
        formattedValue += '-' + value.slice(7, 9);
    }
    if (value.length > 9) {
        formattedValue += '-' + value.slice(9, 11);
    }

    // Устанавливаем отформатированное значение в поле ввода
    input.value = formattedValue;
}

// Обработчик события ввода
document.getElementById('phone').addEventListener('input', function(e) {
    applyPhoneMask(e.target);
});