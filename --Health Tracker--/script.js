document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIG & STATE ---
    const GOALS = { water: 8, sleep: 8, exercise: 30 };
    let currentDate = new Date();
    let dailyChart = null;

    // --- DOM ELEMENT REFERENCES ---
    const elements = {
        dateDisplay: document.getElementById('current-date'),
        prevDayBtn: document.getElementById('prev-day-btn'),
        nextDayBtn: document.getElementById('next-day-btn'),
        water: {
            card: document.getElementById('water-card'),
            count: document.getElementById('water-count'),
            progress: document.getElementById('water-progress'),
            button: document.getElementById('add-water-btn')
        },
        sleep: {
            card: document.getElementById('sleep-card'),
            count: document.getElementById('sleep-count'),
            progress: document.getElementById('sleep-progress'),
            button: document.getElementById('add-sleep-btn')
        },
        exercise: {
            card: document.getElementById('exercise-card'),
            count: document.getElementById('exercise-count'),
            progress: document.getElementById('exercise-progress'),
            button: document.getElementById('add-exercise-btn')
        },
        modal: {
            container: document.getElementById('input-modal'),
            title: document.getElementById('modal-title'),
            prompt: document.getElementById('modal-prompt'),
            input: document.getElementById('modal-input'),
            saveBtn: document.getElementById('modal-save'),
            cancelBtn: document.getElementById('modal-cancel')
        },
        alert: {
            container: document.getElementById('custom-alert'),
            message: document.getElementById('custom-alert-message')
        },
        chartCanvas: document.getElementById('daily-chart').getContext('2d')
    };

    let currentActivity = null;
    let healthData = { water: 0, sleep: 0, exercise: 0 };

    // --- DATE & DATA FUNCTIONS ---

    const getFormattedDateKey = (date) => date.toISOString().split('T')[0];

    const getDisplayDate = (date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (getFormattedDateKey(date) === getFormattedDateKey(today)) return "Today";
        if (getFormattedDateKey(date) === getFormattedDateKey(yesterday)) return "Yesterday";

        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const saveData = () => {
        const key = `healthData-${getFormattedDateKey(currentDate)}`;
        localStorage.setItem(key, JSON.stringify(healthData));
    };

    const loadDataForDate = (date) => {
        currentDate = date;
        const key = `healthData-${getFormattedDateKey(currentDate)}`;
        const storedData = localStorage.getItem(key);
        healthData = storedData ? JSON.parse(storedData) : { water: 0, sleep: 0, exercise: 0 };
        updateAllUI();
    };

    // --- UI UPDATE FUNCTIONS ---

    const updateAllUI = () => {
        elements.dateDisplay.textContent = getDisplayDate(currentDate);
        elements.nextDayBtn.disabled = getFormattedDateKey(currentDate) >= getFormattedDateKey(new Date());

        updateMetricUI('water');
        updateMetricUI('sleep');
        updateMetricUI('exercise');
        updateChart();
    };

    const updateMetricUI = (metric) => {
        const { card, count, progress } = elements[metric];
        const goal = GOALS[metric];
        const currentValue = healthData[metric];

        count.textContent = currentValue;
        const percent = Math.min((currentValue / goal) * 100, 100);
        progress.style.width = `${percent}%`;

        if (currentValue >= goal) {
            card.classList.add('goal-complete');
        } else {
            card.classList.remove('goal-complete');
        }
    };

    // --- CHART FUNCTIONALITY ---
    const updateChart = () => {
        const data = {
            labels: ['Water', 'Sleep', 'Exercise'],
            datasets: [{
                label: 'Goal Completion %',
                data: [
                    (healthData.water / GOALS.water) * 100,
                    (healthData.sleep / GOALS.sleep) * 100,
                    (healthData.exercise / GOALS.exercise) * 100
                ],
                backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(168, 85, 247, 0.7)', 'rgba(34, 197, 94, 0.7)'],
                borderColor: ['#3B82F6', '#A855F7', '#22C55E'],
                borderWidth: 2,
                hoverOffset: 8
            }]
        };

        if (dailyChart) {
            dailyChart.data = data;
            dailyChart.update();
        } else {
            dailyChart = new Chart(elements.chartCanvas, {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    cutout: '60%',
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#d1d5db', font: { size: 14 } } },
                        tooltip: { callbacks: { label: (context) => ` ${context.label}: ${context.raw.toFixed(1)}% Complete` } }
                    }
                }
            });
        }
    };

    // --- MODAL & ALERT FUNCTIONS ---

    const openModal = (activity, title, prompt) => {
        currentActivity = activity;
        elements.modal.title.textContent = title;
        elements.modal.prompt.textContent = prompt;
        elements.modal.input.value = '';
        elements.modal.container.classList.remove('hidden');
        setTimeout(() => elements.modal.input.focus(), 50);
    };

    const closeModal = () => elements.modal.container.classList.add('hidden');

    const showAlert = (message) => {
        elements.alert.message.textContent = message;
        elements.alert.container.classList.remove('hidden', 'alert-hidden');
        elements.alert.container.classList.add('alert-visible');
        setTimeout(() => {
            elements.alert.container.classList.remove('alert-visible');
            elements.alert.container.classList.add('alert-hidden');
            setTimeout(() => elements.alert.container.classList.add('hidden'), 500);
        }, 3000);
    };

    // --- EVENT LISTENERS ---

    elements.prevDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        loadDataForDate(new Date(currentDate));
    });

    elements.nextDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        loadDataForDate(new Date(currentDate));
    });

    elements.water.button.addEventListener('click', () => openModal('water', 'Log Water Intake', 'How many glasses did you drink?'));
    elements.sleep.button.addEventListener('click', () => openModal('sleep', 'Log Sleep', 'How many hours did you sleep?'));
    elements.exercise.button.addEventListener('click', () => openModal('exercise', 'Log Exercise', 'How many minutes did you exercise?'));

    elements.modal.cancelBtn.addEventListener('click', closeModal);
    elements.modal.container.addEventListener('click', (e) => e.target === elements.modal.container && closeModal());

    elements.modal.saveBtn.addEventListener('click', () => {
        const value = parseInt(elements.modal.input.value);
        if (isNaN(value) || value <= 0) return closeModal();

        const goal = GOALS[currentActivity];
        const wasComplete = healthData[currentActivity] >= goal;
        healthData[currentActivity] += value;
        const isNowComplete = healthData[currentActivity] >= goal;

        if (isNowComplete && !wasComplete) {
            showAlert(`Awesome! You've completed your ${currentActivity} goal! 🎉`);
        } else {
            showAlert(`Logged ${value} for ${currentActivity}. Keep it up!`);
        }

        saveData();
        updateAllUI();
        closeModal();
    });

    // --- INITIALIZATION ---
    loadDataForDate(currentDate);
});

