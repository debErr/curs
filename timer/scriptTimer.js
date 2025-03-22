function startTimer() {
    let [milliseconds, seconds, minutes, hours] = [0, 0, 0, 0];
    let timerRef = document.getElementById('timer');
    let int = null;

    if (int !== null) {
        clearInterval(int);
    }
    int = setInterval(displayTimer, 10);

    function displayTimer() {
        milliseconds += 10;
        if (milliseconds == 1000) {
            milliseconds = 0;
            seconds++;
            if (seconds == 60) {
                seconds = 0;
                minutes++;
                if (minutes == 60) {
                    minutes = 0;
                    hours++;
                }
            }
        }

        let h = hours < 10 ? "0" + hours : hours;
        let m = minutes < 10 ? "0" + minutes : minutes;
        let s = seconds < 10 ? "0" + seconds : seconds;
        let ms = milliseconds < 10 ? "00" + milliseconds : milliseconds < 100 ? "0" + milliseconds : milliseconds;

        timerRef.innerHTML = `${h} : ${m} : ${s} : ${ms}`;
    }
}

startTimer();

document.getElementById('logOutButton').addEventListener('click', async () => {
    const work_time = document.getElementById('timer').innerText; // Получаем текущее время работы

    // Получаем email текущего пользователя из сессии
    try {
        const response = await fetch('/get-current-user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        if (result.success) {
            const email = result.email;   // Email текущего пользователя

            // Отправляем время работы на сервер
            const updateResponse = await fetch('/update-work-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, work_time }),
            });

            const updateResult = await updateResponse.json();
            if (updateResult.success) {
                alert('Время работы сохранено');
                window.location.href = '/src';
            } else {
                alert('Ошибка при сохранении времени работы');
            }
        } else {
            alert('Ошибка при получении данных пользователя');
        }
    } catch (error) {
        console.error('Ошибка', error);
        alert('Ошибка при сохранении времени работы');
    }
})