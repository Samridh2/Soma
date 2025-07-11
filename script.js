document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const getStartedBtn = document.getElementById('getStartedBtn');
    const logMoodBtn = document.getElementById('logMoodBtn');
    const startBreathingBtn = document.getElementById('startBreathingBtn');
    const addWaterBtn = document.getElementById('addWaterBtn');
    const resetWaterBtn = document.getElementById('resetWaterBtn');
    const refreshRecsBtn = document.getElementById('refreshRecsBtn');
    const waterLevel = document.getElementById('waterLevel');
    const waterAmount = document.getElementById('waterAmount');
    const aqiLocation = document.getElementById('aqiLocation');
    const tempDays = document.getElementById('tempDays');
    const currentTemp = document.getElementById('currentTemp');
    const recommendationsList = document.getElementById('recommendationsList');
    const currentAqiDisplay = document.getElementById('currentAqiDisplay'); // Element to display the fetched AQI
    const aqiStatusText = document.getElementById('aqiStatusText'); // Element for AQI status text
    const pm25Display = document.getElementById('pm25Display'); // Element for PM2.5 display
    const o3Display = document.getElementById('o3Display');     // Element for O3 display
    const humidityDisplay = document.getElementById('humidityDisplay'); // Element for Humidity display
    const windDisplay = document.getElementById('windDisplay');         // Element for Wind display

    // Mood Modal Elements
    const moodModal = document.getElementById('moodModal');
    const moodOptions = document.querySelectorAll('.mood-option');
    const logMoodSubmitBtn = document.getElementById('logMoodSubmitBtn');
    const cancelMoodBtn = document.getElementById('cancelMoodBtn');
    const moodLogEntries = document.getElementById('moodLogEntries'); // Container for mood entries

    // Breathing Exercise Elements
    const exerciseDurationSelect = document.getElementById('exerciseDuration');
    const breathingAnimationCircle = document.getElementById('breathingAnimationCircle');
    const inhaleExhaleText = document.getElementById('inhaleExhaleText');
    const remainingTimeDisplay = document.getElementById('remainingTime');

    // Scroll target section
    const trackHealthSection = document.getElementById('trackHealthSection');

    // State
    // Initialize waterCount from sessionStorage, or 0 if not found
    let waterCount = parseInt(sessionStorage.getItem('somaWaterCount')) || 0;
    let isBreathingExerciseActive = false;
    let currentSimulatedAqi = 60; // Initialize with a typical moderate AQI for Bangalore
    let currentSimulatedTemp = 0;
    let currentSimulatedHumidity = 0;
    let currentSimulatedWind = 0;
    let selectedMood = null; // To store the mood selected in the modal
    // Initialize moodLogs from sessionStorage, or empty array if not found
    let moodLogs = JSON.parse(sessionStorage.getItem('somaMoodLogs')) || [];

    // Breathing Exercise State
    let exerciseTotalDuration = 0; // in milliseconds
    let exerciseStartTime = 0;
    let animationFrameId = null; // To store the requestAnimationFrame ID
    const inhaleDuration = 4000; // 4 seconds inhale
    const holdInDuration = 1000; // 1 second hold
    const exhaleDuration = 4000; // 4 seconds exhale
    const holdOutDuration = 1000; // 1 second hold
    const cycleDuration = inhaleDuration + holdInDuration + exhaleDuration + holdOutDuration; // Total 10 seconds per cycle

    // Header Text Animation Elements and State
    const dynamicHeaderTextSpan = document.getElementById('dynamicHeaderText'); // The span holding the dynamic text
    const headerCaret = document.querySelector('.header-caret'); // The caret span
    // Redefine dynamic parts, static part remains in HTML h1
    const dynamicPart1 = "Companion";
    const dynamicPart2 = "& Wellbeing";

    // Typing speed (milliseconds per character)
    const typingSpeed = 100;
    const backspacingSpeed = 50;
    const pauseBeforeTyping = 1000; // Pause before typing new text
    const pauseBeforeBackspacing = 1500; // Pause before backspacing

    // Initialize
    updateWaterDisplay();
    updateSimulatedAQIData(); // Initial call to set AQI
    updateSimulatedWeatherData(); // Initial call to set weather
    renderTempChart(); // Initial render of temp chart
    renderMoodLogs(); // Render existing mood logs on load
    generateRecommendations(); // Initial call to generate recommendations on page load

    // Start continuous data updates
    setInterval(updateSimulatedAQIData, 60000); // Update AQI every minute
    setInterval(updateSimulatedWeatherData, 60000); // Update weather every minute

    // Start header text animation
    animateHeaderText();

    // Event Listeners
    getStartedBtn.addEventListener('click', () => {
        if (!trackHealthSection) return;
    
        const targetY = trackHealthSection.getBoundingClientRect().top + window.pageYOffset;
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const duration = 800; // milliseconds
        const startTime = performance.now();
    
        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
    
        function scrollStep(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutQuad(progress);
            window.scrollTo(0, startY + distance * ease);
    
            if (elapsed < duration) {
                requestAnimationFrame(scrollStep);
            }
        }
    
        requestAnimationFrame(scrollStep);
    });

    // Mood Logging Event Listeners
    logMoodBtn.addEventListener('click', () => {
        showMoodModal();
    });

    moodOptions.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'selected' class from all buttons
            moodOptions.forEach(btn => btn.classList.remove('selected-mood'));
            // Add 'selected' class to the clicked button
            button.classList.add('selected-mood');
            selectedMood = button.dataset.mood;
        });
    });

    logMoodSubmitBtn.addEventListener('click', () => {
        if (selectedMood) {
            logMood(selectedMood, 100); // Defaulting strength to 100
            hideMoodModal();
        } else {
            console.log('Please select a mood before logging.');
        }
    });

    cancelMoodBtn.addEventListener('click', () => {
        hideMoodModal();
    });

    // Breathing Exercise Event Listeners
    startBreathingBtn.addEventListener('click', () => {
        if (!isBreathingExerciseActive) {
            startBreathingExercise();
            startBreathingBtn.textContent = 'Stop Exercise';
        } else {
            stopBreathingExercise();
            startBreathingBtn.textContent = 'Begin Breathing Exercise';
        }
        isBreathingExerciseActive = !isBreathingExerciseActive;
    });

    exerciseDurationSelect.addEventListener('change', () => {
        if (!isBreathingExerciseActive) {
            updateRemainingTimeDisplay(parseInt(exerciseDurationSelect.value) * 60);
        }
    });

    addWaterBtn.addEventListener('click', () => {
        if (waterCount < 10) {
            waterCount++;
            updateWaterDisplay();
            sessionStorage.setItem('somaWaterCount', waterCount); // Save to sessionStorage
        } else {
            console.log("You've reached the recommended daily water intake. Great job!");
        }
    });

    resetWaterBtn.addEventListener('click', () => {
        waterCount = 0;
        updateWaterDisplay();
        sessionStorage.setItem('somaWaterCount', waterCount); // Save to sessionStorage
    });

    refreshRecsBtn.addEventListener('click', generateRecommendations);
    aqiLocation.addEventListener('change', updateSimulatedAQIData);
    tempDays.addEventListener('change', renderTempChart);

    // Functions

    /**
     * Animates the header text with typing and backspacing effects.
     * This function runs in a continuous loop.
     */
    async function animateHeaderText() {
        // Ensure the dynamic span starts empty
        dynamicHeaderTextSpan.textContent = '';
        let caretVisible = true;

        // Function to toggle caret visibility
        function toggleCaret() {
            if (caretVisible) {
                headerCaret.style.backgroundColor = 'transparent';
            } else {
                headerCaret.style.backgroundColor = 'white';
            }
            caretVisible = !caretVisible;
            setTimeout(toggleCaret, 750); // Blinks every 0.75 seconds
        }

        toggleCaret(); // Start blinking the caret immediately

        await new Promise(resolve => setTimeout(resolve, pauseBeforeTyping)); // Initial pause before first typing

        while (true) {
            // 1. Type dynamicPart1 ("Companion")
            for (let i = 0; i <= dynamicPart1.length; i++) {
                dynamicHeaderTextSpan.textContent = dynamicPart1.substring(0, i);
                await new Promise(resolve => setTimeout(resolve, typingSpeed));
            }
            await new Promise(resolve => setTimeout(resolve, pauseBeforeBackspacing));

            // 2. Backspace dynamicPart1
            for (let i = dynamicPart1.length; i >= 0; i--) {
                dynamicHeaderTextSpan.textContent = dynamicPart1.substring(0, i);
                await new Promise(resolve => setTimeout(resolve, backspacingSpeed));
            }
            await new Promise(resolve => setTimeout(resolve, pauseBeforeTyping));

            // 3. Type dynamicPart2 ("& Wellbeing")
            for (let i = 0; i <= dynamicPart2.length; i++) {
                dynamicHeaderTextSpan.textContent = dynamicPart2.substring(0, i);
                await new Promise(resolve => setTimeout(resolve, typingSpeed));
            }
            await new Promise(resolve => setTimeout(resolve, pauseBeforeBackspacing));

            // 4. Backspace dynamicPart2
            for (let i = dynamicPart2.length; i >= 0; i--) {
                dynamicHeaderTextSpan.textContent = dynamicPart2.substring(0, i);
                await new Promise(resolve => setTimeout(resolve, backspacingSpeed));
            }
            await new Promise(resolve => setTimeout(resolve, pauseBeforeTyping));
        }
    }


    function updateWaterDisplay() {
        const height = (waterCount / 10) * 100;
        waterLevel.style.height = `${height}%`;
        waterAmount.textContent = waterCount;

        if (waterCount < 4) {
            waterLevel.style.backgroundColor = '#fca5a5';
        } else if (waterCount < 8) {
            waterLevel.style.backgroundColor = '#93c5fd';
        } else {
            waterLevel.style.backgroundColor = '#86efac';
        }
    }

    function startBreathingExercise() {
        exerciseTotalDuration = parseInt(exerciseDurationSelect.value) * 60 * 1000; // Convert minutes to milliseconds
        exerciseStartTime = performance.now();
        breathingAnimationCircle.classList.remove('exhale', 'inhale'); // Reset classes
        inhaleExhaleText.textContent = 'Ready?';
        
        animateBreathing(performance.now()); // Start the animation loop
    }

    function stopBreathingExercise() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        isBreathingExerciseActive = false; // Set state to inactive
        breathingAnimationCircle.classList.remove('inhale', 'exhale');
        breathingAnimationCircle.style.transform = 'scale(1)'; // Reset scale
        breathingAnimationCircle.style.backgroundColor = 'var(--indigo-200)'; // Reset color
        inhaleExhaleText.textContent = 'Done!';
        updateRemainingTimeDisplay(0); // Set time to 00:00
        startBreathingBtn.textContent = 'Begin Breathing Exercise'; // Reset button text
        console.log('Breathing exercise completed.');

        // Reset "Done!" message and timer display after 3 seconds
        setTimeout(() => {
            inhaleExhaleText.textContent = 'Ready?';
            updateRemainingTimeDisplay(parseInt(exerciseDurationSelect.value) * 60); // Reset timer display to selected duration
        }, 3000); // 3 seconds delay
    }

    function animateBreathing(currentTime) {
        const elapsedTime = currentTime - exerciseStartTime;
        const remainingDuration = exerciseTotalDuration - elapsedTime;

        if (remainingDuration <= 0) {
            stopBreathingExercise();
            return;
        }

        updateRemainingTimeDisplay(Math.ceil(remainingDuration / 1000)); // Update every second

        const cycleTime = elapsedTime % cycleDuration;

        breathingAnimationCircle.style.transitionDuration = '4s'; // Default transition duration

        if (cycleTime < inhaleDuration) {
            // Inhale phase
            breathingAnimationCircle.classList.add('inhale');
            breathingAnimationCircle.classList.remove('exhale');
            inhaleExhaleText.textContent = 'Inhale';
        } else if (cycleTime < inhaleDuration + holdInDuration) {
            // Hold In phase
            breathingAnimationCircle.classList.remove('inhale', 'exhale');
            inhaleExhaleText.textContent = 'Hold';
            breathingAnimationCircle.style.transitionDuration = '0s'; // No transition during hold
        } else if (cycleTime < inhaleDuration + holdInDuration + exhaleDuration) {
            // Exhale phase
            breathingAnimationCircle.classList.add('exhale');
            breathingAnimationCircle.classList.remove('inhale');
            inhaleExhaleText.textContent = 'Exhale';
        } else {
            // Hold Out phase
            breathingAnimationCircle.classList.remove('inhale', 'exhale');
            inhaleExhaleText.textContent = 'Hold';
            breathingAnimationCircle.style.transitionDuration = '0s'; // No transition during hold
        }

        animationFrameId = requestAnimationFrame(animateBreathing);
    }

    function updateRemainingTimeDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        remainingTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }


    /**
     * Simulates fetching AQI data and related pollutant levels by generating values
     * that are near the previous value, reflecting a more natural fluctuation.
     * The AQI changes based on the time of day, with low fluctuations.
     */
    function updateSimulatedAQIData() {
        const now = new Date();
        const hour = now.getHours(); // 0-23

        let baseAqi;
        const aqiFluctuationRange = 5; // Keep fluctuations very low (-2.5 to +2.5)

        // Define base AQI levels based on time of day
        if (hour >= 4 && hour < 9) { // Morning (e.g., 4 AM - 9 AM): Fresh Air
            baseAqi = 30; // Good AQI
        } else if (hour >= 9 && hour < 18) { // Day (e.g., 9 AM - 6 PM): More Pollution
            baseAqi = 120; // Unhealthy for Sensitive Groups
        } else { // Evening/Night (e.g., 6 PM - 4 AM): Moderate
            baseAqi = 60; // Moderate AQI
        }

        // Generate a random change within the defined fluctuation range
        const aqiChange = Math.floor(Math.random() * aqiFluctuationRange) - (aqiFluctuationRange / 2);
        let newAqi = baseAqi + aqiChange;

        // Ensure the AQI stays within a realistic range (e.g., 20 to 150)
        newAqi = Math.max(20, Math.min(150, newAqi));
        currentSimulatedAqi = newAqi; // Update the current AQI for the next iteration

        // Simulate PM2.5 and O3 based on the current AQI
        let simulatedPm25;
        let simulatedO3;

        // Base ranges for pollutants, adjusted by AQI level
        if (currentSimulatedAqi <= 50) { // Good
            simulatedPm25 = Math.floor(Math.random() * 5) + 8; // 8-12 µg/m³
            simulatedO3 = Math.floor(Math.random() * 10) + 25;  // 25-34 ppb
        } else if (currentSimulatedAqi <= 100) { // Moderate
            simulatedPm25 = Math.floor(Math.random() * 10) + 18; // 18-27 µg/m³
            simulatedO3 = Math.floor(Math.random() * 10) + 45;  // 45-54 ppb
        } else if (currentSimulatedAqi <= 150) { // Unhealthy for Sensitive Groups
            simulatedPm25 = Math.floor(Math.random() * 15) + 35; // 35-49 µg/m³
            simulatedO3 = Math.floor(Math.random() * 10) + 65;  // 65-74 ppb
        } else { // Fallback for higher values (though capped at 150)
            simulatedPm25 = Math.floor(Math.random() * 20) + 55; // 55-74 µg/m³
            simulatedO3 = Math.floor(Math.random() * 10) + 85;  // 85-94 ppb
        }

        console.log(`Simulated Bangalore AQI: ${currentSimulatedAqi}, PM2.5: ${simulatedPm25}, O3: ${simulatedO3}`);

        if (currentAqiDisplay) {
            currentAqiDisplay.textContent = `${currentSimulatedAqi}`;
        }
        if (aqiStatusText) {
            if (currentSimulatedAqi <= 50) aqiStatusText.textContent = 'Good';
            else if (currentSimulatedAqi <= 100) aqiStatusText.textContent = 'Moderate';
            else if (currentSimulatedAqi <= 150) aqiStatusText.textContent = 'Unhealthy for Sensitive Groups';
            else if (currentSimulatedAqi <= 200) aqiStatusText.textContent = 'Unhealthy';
            else if (currentSimulatedAqi <= 300) aqiStatusText.textContent = 'Very Unhealthy';
            else aqiStatusText.textContent = 'Hazardous';

            aqiStatusText.style.color = getAQIColor(currentSimulatedAqi); // Apply color based on AQI value
        }

        // Update PM2.5 and O3 displays
        if (pm25Display) {
            pm25Display.textContent = `${simulatedPm25} µg/m³`;
        }
        if (o3Display) {
            o3Display.textContent = `${simulatedO3} ppb`;
        }

        renderAQIChart(currentSimulatedAqi); // Render chart with the simulated AQI value
    }

    /**
     * Simulates real-time weather updates with natural fluctuations and daily patterns.
     */
    function updateSimulatedWeatherData() {
        const now = new Date();
        const hour = now.getHours(); // 0-23

        // Base temperature for Bangalore (typical average)
        let baseTemp = 24;
        // Adjust base temperature based on hour of the day (e.g., cooler at night, warmer in afternoon)
        // Using a sine wave for smooth daily cycle: peaks around 2 PM (hour 14), lowest around 4 AM (hour 4)
        baseTemp += Math.sin((hour - 8) * Math.PI / 12) * 6; // Amplitude of 6°C, shifted to peak in afternoon

        // Simulate temperature change (-2 to +2 °C) around the base
        const tempChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
        let newTemp = Math.round(baseTemp + tempChange);
        newTemp = Math.max(18, Math.min(32, newTemp)); // Keep temperature within a reasonable range for Bangalore
        currentSimulatedTemp = newTemp; // Update state

        // Base humidity for Bangalore
        let baseHumidity = 65;
        // Adjust humidity based on hour (often higher at night/morning, lower in afternoon)
        baseHumidity += Math.cos((hour - 6) * Math.PI / 12) * 10; // Amplitude of 10%, shifted
        // Simulate humidity change (-5 to +5 %)
        const humidityChange = Math.floor(Math.random() * 11) - 5; // -5 to +5
        let newHumidity = Math.round(baseHumidity + humidityChange);
        newHumidity = Math.max(40, Math.min(90, newHumidity)); // Keep humidity within a reasonable range
        currentSimulatedHumidity = newHumidity; // Update state

        // Base wind speed for Bangalore
        let baseWind = 12;
        // Adjust wind based on hour (often calmer at night, slightly stronger in afternoon)
        baseWind += Math.sin((hour - 10) * Math.PI / 12) * 5; // Amplitude of 5 km/h, shifted
        // Simulate wind speed change (-2 to +2 km/h)
        const windChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
        let newWind = Math.round(baseWind + windChange);
        newWind = Math.max(5, Math.min(25, newWind)); // Keep wind speed within a reasonable range
        currentSimulatedWind = newWind; // Update state

        // Simulate weather description based on temperature and humidity
        let weatherDescription;
        if (currentSimulatedTemp > 28 && currentSimulatedHumidity < 60) {
            weatherDescription = 'Sunny';
        } else if (currentSimulatedTemp > 20 && currentSimulatedHumidity >= 60 && currentSimulatedHumidity < 80) {
            weatherDescription = 'Partly Cloudy';
        } else if (currentSimulatedHumidity >= 80 || currentSimulatedTemp < 20) {
            weatherDescription = 'Cloudy';
        } else {
            weatherDescription = 'Clear'; // Default for other conditions
        }


        if (currentTemp) {
            currentTemp.textContent = `${currentSimulatedTemp}°C`;
        }
        if (currentTemp.nextElementSibling) { // Assuming weather description is the next sibling
            currentTemp.nextElementSibling.textContent = weatherDescription;
        }
        if (humidityDisplay) {
            humidityDisplay.textContent = `${currentSimulatedHumidity}%`;
        }
        if (windDisplay) {
            windDisplay.textContent = `${currentSimulatedWind} km/h`;
        }

        console.log(`Simulated Weather: ${currentSimulatedTemp}°C, ${weatherDescription}, Humidity: ${currentSimulatedHumidity}%, Wind: ${currentSimulatedWind} km/h`);
    }


    /**
     * Renders the AQI chart based on the provided AQI value.
     * The AQI values for the graph points are now generated with low fluctuations around time-dependent base levels.
     * @param {number} aqi The current AQI value.
     */
    function renderAQIChart(aqi) {
        const aqiChart = document.getElementById('aqiChart');
        aqiChart.innerHTML = '';

        const now = new Date();
        const currentHour = now.getHours();
        const dataPoints = [];
        const numPoints = 5; // Number of points on the graph
        const aqiFluctuationRange = 5; // Keep fluctuations very low for the graph points too

        for (let i = 0; i < numPoints; i++) {
            // Calculate hour for each point, distributing across 24 hours
            const hourOffset = (24 / (numPoints - 1)) * i;
            const simulatedHour = (currentHour + hourOffset) % 24;

            let baseAqiForHour;
            // Define base AQI levels for graph points based on simulated hour
            if (simulatedHour >= 4 && simulatedHour < 9) { // Morning
                baseAqiForHour = 30; // Good AQI
            } else if (simulatedHour >= 9 && simulatedHour < 18) { // Day
                baseAqiForHour = 120; // Unhealthy for Sensitive Groups
            } else { // Evening/Night
                baseAqiForHour = 60; // Moderate AQI
            }
            
            // Apply low fluctuation
            const aqiFluctuation = Math.floor(Math.random() * aqiFluctuationRange) - (aqiFluctuationRange / 2);
            let pointAqi = Math.round(baseAqiForHour + aqiFluctuation);
            pointAqi = Math.max(20, Math.min(150, pointAqi)); // Clamp values
            dataPoints.push(pointAqi);
        }


        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 500 100');

        for (let i = 0; i < dataPoints.length - 1; i++) {
            const x1 = i * (500 / (dataPoints.length - 1)) + (500 / (dataPoints.length - 1)) / 2;
            const y1 = 100 - (dataPoints[i] / 150) * 80 - 10; // Scale AQI to fit chart height (max 150 for better visual)
            const x2 = (i + 1) * (500 / (dataPoints.length - 1)) + (500 / (dataPoints.length - 1)) / 2;
            const y2 = 100 - (dataPoints[i + 1] / 150) * 80 - 10;

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', getAQIColor(dataPoints[i])); // Color based on AQI value
            line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-linecap', 'round');
            svg.appendChild(line);

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', x1);
            circle.setAttribute('cy', y1);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', getAQIColor(dataPoints[i])); // Color based on AQI value
            svg.appendChild(circle);

            // Add the last circle
            if (i === dataPoints.length - 2) {
                const lastCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                lastCircle.setAttribute('cx', x2);
                lastCircle.setAttribute('cy', y2);
                lastCircle.setAttribute('r', '5');
                lastCircle.setAttribute('fill', getAQIColor(dataPoints[i + 1]));
                svg.appendChild(lastCircle);
            }
        }

        aqiChart.appendChild(svg);
    }

    function renderTempChart() {
        const period = tempDays.value;
        const tempChart = document.getElementById('tempChart');
        tempChart.innerHTML = '';

        const dataPoints = [];
        const now = new Date();
        const currentHour = now.getHours();

        if (period === 'Today') {
            const numPoints = 5; // Representing 5 points across the day
            for (let i = 0; i < numPoints; i++) {
                const hourOffset = (24 / (numPoints - 1)) * i; // Distribute points over 24 hours
                const projectedHour = (currentHour + hourOffset) % 24;

                let baseTempForHour = 24; // Average Bangalore temp
                // Apply a more pronounced sine wave for daily temperature cycle
                baseTempForHour += Math.sin((projectedHour - 8) * Math.PI / 12) * 7; // Amplitude of 7°C, peak around 3 PM

                let tempPoint = Math.round(baseTempForHour + (Math.random() * 3 - 1.5)); // Add small random noise
                tempPoint = Math.max(18, Math.min(32, tempPoint)); // Clamp temperature within a realistic range
                dataPoints.push(tempPoint);
            }
        } else if (period === 'Weekly') {
            for (let i = 0; i < 7; i++) {
                // Simulate daily average temperatures with some fluctuation
                let baseWeeklyTemp = 25 + Math.sin(i * Math.PI / 3.5) * 3; // Gentle sine wave for weekly trend
                dataPoints.push(Math.round(baseWeeklyTemp + (Math.random() * 4 - 2))); // Add noise
            }
        } else { // Monthly
            for (let i = 0; i < 30; i += 6) { // 5 points for a month (approx every 6 days)
                // Simulate monthly average temperatures with seasonal variation
                let baseMonthlyTemp = 27 + Math.sin(i * Math.PI / 15) * 5; // Larger sine wave for monthly trend
                dataPoints.push(Math.round(baseMonthlyTemp + (Math.random() * 6 - 3))); // Add more noise
            }
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 500 100');

        // Find min/max temp for dynamic scaling
        const minTemp = Math.min(...dataPoints) - 5; // Give some padding
        const maxTemp = Math.max(...dataPoints) + 5; // Give some padding
        const tempRange = maxTemp - minTemp;

        for (let i = 0; i < dataPoints.length - 1; i++) {
            const x1 = (i / (dataPoints.length - 1)) * 450 + 25;
            const y1 = 100 - ((dataPoints[i] - minTemp) / tempRange) * 80 - 10; // Scale dynamically
            const x2 = ((i + 1) / (dataPoints.length - 1)) * 450 + 25;
            const y2 = 100 - ((dataPoints[i + 1] - minTemp) / tempRange) * 80 - 10;

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#3b82f6');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-linecap', 'round');
            svg.appendChild(line);

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', x1);
            circle.setAttribute('cy', y1);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#3b82f6');
            svg.appendChild(circle);

            // Add the last circle
            if (i === dataPoints.length - 2) {
                const lastCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                lastCircle.setAttribute('cx', x2);
                lastCircle.setAttribute('cy', y2);
                lastCircle.setAttribute('r', '4');
                lastCircle.setAttribute('fill', '#3b82f6');
                svg.appendChild(lastCircle);
            }
        }

        tempChart.appendChild(svg);
    }

    function getAQIColor(aqi) {
        if (aqi <= 50) return '#10b981'; // Good - Green
        if (aqi <= 100) return '#f59e0b'; // Moderate - Yellow/Orange
        if (aqi <= 150) return '#f97316'; // Unhealthy for Sensitive Groups - Orange/Red
        if (aqi <= 200) return '#ef4444'; // Unhealthy - Red
        if (aqi <= 300) return '#8b5cf6'; // Very Unhealthy - Purple
        return '#dc2626'; // Hazardous - Dark Red
    }

    /**
     * Generates a list of recommendations based on current AQI and weather conditions.
     */
    function generateRecommendations() {
        const now = new Date();
        const hour = now.getHours();
        const aqi = currentSimulatedAqi;
        const temp = currentSimulatedTemp;
        const humidity = currentSimulatedHumidity;
        const wind = currentSimulatedWind;

        let availableRecommendations = [];

        // General recommendations (always available)
        availableRecommendations.push(
            "Check local news for any environmental advisories and updates.",
            "Ensure your home ventilation system is clean and optimized for air circulation.",
            "Stay informed about local pollen counts, especially if you have seasonal allergies.",
            "Practice mindful breathing exercises to improve lung capacity and reduce stress.",
            "Maintain a balanced diet rich in antioxidants to support your immune system against environmental stressors.",
            "Get adequate sleep (7-9 hours) to help your body recover and adapt to environmental changes.",
            "Consider adding indoor plants that help purify the air, such as snake plants, peace lilies, or spider plants.",
            "Limit exposure to indoor air pollutants like smoke, strong cleaning chemicals, aerosols, and synthetic fragrances.",
            "Stay hydrated throughout the day by drinking plenty of water.",
            "Incorporate regular light exercise, even indoors, to boost your overall wellbeing.",
            "Keep an eye on your local weather forecast for any sudden changes.",
            "Consider a digital detox to reduce eye strain and mental fatigue from screens."
        );

        // AQI-based recommendations
        if (aqi <= 50) { // Good AQI
            availableRecommendations.push(
                "Enjoy prolonged outdoor activities like hiking, running, or cycling in nature.",
                "Open windows and doors wide to air out your home and enjoy the fresh, clean air.",
                "Plan a picnic or outdoor gathering with friends and family in a park.",
                "Take a deep breath and appreciate the excellent air quality; it's a rare gift!",
                "Consider exercising outdoors in green spaces or along waterfronts.",
                "It's a great day for outdoor sports, gardening, or a leisurely stroll.",
                "Engage in outdoor photography or sketching to connect with nature.",
                "Host an outdoor yoga or meditation session."
            );
        } else if (aqi <= 100) { // Moderate AQI
            availableRecommendations.push(
                "Limit prolonged or heavy exertion outdoors, especially if you are sensitive to air pollution or have respiratory conditions.",
                "Consider using an air purifier indoors, particularly in bedrooms and main living areas.",
                "Opt for indoor exercise or less strenuous outdoor activities if you feel any discomfort or irritation.",
                "Keep windows closed during peak traffic hours or when pollution is visibly higher (e.g., during rush hour).",
                "Monitor your respiratory symptoms closely if you have asthma, COPD, or other sensitivities.",
                "Reduce time spent near busy roads, industrial zones, or construction sites.",
                "If cycling, consider routes with less traffic and more green cover.",
                "Take frequent breaks if working outdoors."
            );
        } else if (aqi <= 150) { // Unhealthy for Sensitive Groups
            availableRecommendations.push(
                "Sensitive groups (children, elderly, pregnant women, and those with heart/lung disease) should reduce prolonged or heavy outdoor exertion.",
                "Consider wearing a high-quality mask (N95 or equivalent) if you must be outdoors for extended periods.",
                "Keep windows and doors closed tightly to prevent outdoor pollution from entering your home.",
                "Run your HVAC system with a high-efficiency particulate air (HEPA) filter if available, and ensure filters are clean.",
                "Avoid exercising near busy roads, construction sites, or industrial areas entirely.",
                "Stay hydrated to help your body cope with increased air pollutants.",
                "Limit car travel and consider public transport or carpooling to reduce personal exposure.",
                "If you experience coughing, shortness of breath, or chest discomfort, seek medical advice."
            );
        } else if (aqi <= 200) { // Unhealthy
            availableRecommendations.push(
                "Everyone should avoid prolonged or heavy outdoor exertion. It's best to stay indoors.",
                "Stay indoors as much as possible, especially children, the elderly, and individuals with pre-existing health conditions.",
                "Use an air purifier with a HEPA filter continuously in all occupied rooms.",
                "Minimize driving and consider public transport or carpooling to reduce your contribution to emissions.",
                "Consult a doctor if you experience persistent respiratory symptoms like coughing, wheezing, or shortness of breath.",
                "Avoid burning candles, incense, or using fireplaces indoors as they add to indoor pollution.",
                "If you must go out, wear a certified N95 or P100 respirator mask.",
                "Postpone outdoor events or gatherings."
            );
        } else { // Very Unhealthy / Hazardous
            availableRecommendations.push(
                "Avoid all outdoor physical activity and stay indoors at all times.",
                "Keep windows and doors tightly shut and seal any drafts to minimize outdoor air infiltration.",
                "Ensure your air purifier is running at maximum efficiency and filters are clean; consider running multiple units if possible.",
                "Minimize exposure to all indoor sources of pollution (e.g., smoking, cooking fumes, strong cleaning products, even vacuuming).",
                "Seek immediate medical attention if you have severe symptoms like persistent wheezing, severe chest pain, or difficulty breathing.",
                "Consider evacuating to an area with significantly better air quality if possible and advised by health authorities.",
                "Limit cooking methods that produce a lot of smoke or fumes.",
                "Stay informed through official health advisories and emergency broadcasts."
            );
        }

        // Weather-based recommendations
        if (temp > 28 && humidity < 60) { // Hot & Sunny (e.g., Summer in Bangalore)
            availableRecommendations.push(
                "Increase hydration to at least 10-12 glasses of water today to prevent dehydration and heat exhaustion.",
                "Wear light-colored, loose-fitting, breathable clothing made of cotton or linen to stay cool.",
                "Seek shade during peak sun hours (10 AM - 4 PM) and avoid direct sun exposure.",
                "Consider taking cool showers or baths to regulate body temperature and refresh yourself.",
                "Limit strenuous outdoor activities to early morning or late evening when temperatures are lower.",
                "Use sunscreen with high SPF (30+) and wear a wide-brimmed hat and sunglasses when outdoors.",
                "Eat light, refreshing meals like salads and fruits.",
                "Check on elderly neighbors or those who might be vulnerable to heat."
            );
        } else if (temp < 20 || humidity >= 80) { // Cool or Very Humid/Cloudy (e.g., Monsoon/Winter in Bangalore)
            availableRecommendations.push(
                "Dress in layers to stay warm and comfortable if it's cool or chilly outside.",
                "Ensure proper ventilation in your home to prevent mold and mildew growth if humidity is high.",
                "Consider a warm, comforting drink like herbal tea, hot chocolate, or a bowl of soup.",
                "Engage in indoor activities that boost mood on cloudy or rainy days, such as reading, crafting, or board games.",
                "Check for damp spots in your home and address them promptly to prevent mold and mildew.",
                "Use dehumidifiers if indoor humidity levels are consistently high to maintain comfort and health.",
                "If it's raining, carry an umbrella or wear waterproof clothing.",
                "Boost your immunity with Vitamin C and D during cooler months."
            );
        } else if (wind > 15) { // Windy
            availableRecommendations.push(
                "Be aware of increased dust, pollen, and other airborne allergens due to strong winds; consider an antihistamine if prone to allergies.",
                "Secure any outdoor items that might blow away or cause damage, such as patio furniture or loose decorations.",
                "Protect your eyes from wind-blown particles by wearing glasses or sunglasses, especially when outdoors.",
                "If you have respiratory issues, consider staying indoors during very windy conditions to avoid irritation.",
                "Close windows and doors tightly to prevent dust and allergens from entering your home.",
                "Stay clear of tall trees or unstable structures during strong gusts.",
                "Avoid burning outdoor fires or bonfires on windy days."
            );
        } else { // Mild/Pleasant Weather
            availableRecommendations.push(
                "Enjoy a leisurely walk or light outdoor activity in a park or green space.",
                "Spend some quality time in nature to boost your mood and reduce stress.",
                "Open windows to let in fresh air and enjoy the pleasant breeze.",
                "It's a perfect day for gardening, outdoor hobbies, or dining al fresco.",
                "Consider a gentle outdoor yoga session or meditation.",
                "Plan a short bike ride or a stroll around your neighborhood."
            );
        }

        // Time-of-day specific recommendations (can overlap with others)
        if (hour >= 5 && hour < 8) { // Early Morning
            availableRecommendations.push(
                "If AQI is good, consider an early morning walk or jog for fresh air and a good start to the day.",
                "Hydrate well upon waking up to kickstart your metabolism and energy levels.",
                "Plan your day's outdoor activities for the morning when air quality is often best.",
                "Enjoy a quiet moment with a cup of coffee or tea before the day gets busy."
            );
        } else if (hour >= 12 && hour < 15) { // Midday
            availableRecommendations.push(
                "If AQI is high, avoid strenuous outdoor activity during midday peak pollution and heat.",
                "Take a short break to stretch and move, even if indoors, to combat midday slump.",
                "Opt for a light, refreshing lunch to avoid feeling sluggish.",
                "If working from home, ensure your workspace is well-ventilated but protected from outdoor elements."
            );
        } else if (hour >= 18 && hour < 21) { // Evening
            availableRecommendations.push(
                "Wind down with a relaxing activity before bed, such as reading, gentle stretching, or listening to calming music.",
                "Prepare your home for the night by closing windows if pollution is expected to rise or temperatures drop.",
                "Consider a light dinner to aid digestion before sleep.",
                "Reflect on your day and practice gratitude."
            );
        } else { // Late Night / Early Morning (before 5 AM)
            availableRecommendations.push(
                "Ensure your bedroom is well-ventilated but secure for optimal sleep quality.",
                "Prioritize uninterrupted sleep for optimal physical and mental health.",
                "Avoid heavy meals or excessive screen time close to bedtime.",
                "If you wake up, practice a short breathing exercise to help fall back asleep."
            );
        }


        // Shuffle and select a maximum of 3 unique recommendations
        const uniqueRecommendations = Array.from(new Set(availableRecommendations)); // Remove duplicates
        const shuffled = uniqueRecommendations.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3); // Always pick 3

        recommendationsList.innerHTML = '';
        if (selected.length === 0) {
            const li = document.createElement('li');
            li.className = 'flex items-start recommendation-item-transition'; // Add transition class
            li.innerHTML = `
                <i class="fas fa-info-circle text-gray-500 mt-1 mr-2"></i>
                <p>No specific recommendations available for current conditions, but remember to stay hydrated and mindful!</p>
            `;
            recommendationsList.appendChild(li);
        } else {
            selected.forEach((rec, index) => {
                const li = document.createElement('li');
                li.className = 'flex items-start recommendation-item-transition'; // Add transition class
                li.style.transitionDelay = `${index * 0.1}s`; // Stagger the animation
                li.innerHTML = `
                    <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <p>${rec}</p>
                `;
                recommendationsList.appendChild(li);
                // Trigger reflow to ensure transition plays
                void li.offsetWidth;
                li.classList.add('recommendation-item-active');
            });
        }

        refreshRecsBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Recommendations Updated';
        setTimeout(() => {
            refreshRecsBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Refresh Recommendations';
        }, 2000);
    }

    // Mood Logging Functions
    function showMoodModal() {
        moodModal.classList.remove('hidden');
        // Reset selected mood and button styles
        selectedMood = null;
        moodOptions.forEach(btn => btn.classList.remove('selected-mood'));
    }

    function hideMoodModal() {
        moodModal.classList.add('hidden');
    }

    function logMood(mood, strength) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let iconClass = '';
        let moodColorClass = '';
        switch (mood) {
            case 'Happy':
                iconClass = 'fas fa-smile';
                moodColorClass = 'text-green-500';
                break;
            case 'Neutral':
                iconClass = 'fas fa-meh';
                moodColorClass = 'text-blue-500';
                break;
            case 'Sad':
                iconClass = 'fas fa-frown';
                moodColorClass = 'text-red-500';
                break;
            case 'Anxious':
                iconClass = 'fas fa-tired';
                moodColorClass = 'text-orange-500';
                break;
            case 'Energetic':
                iconClass = 'fas fa-bolt';
                moodColorClass = 'text-yellow-500';
                break;
            default:
                iconClass = 'fas fa-question-circle';
                moodColorClass = 'text-gray-500';
        }

        moodLogs.unshift({ // Add to the beginning to show most recent first
            mood: mood,
            time: timeString,
            iconClass: iconClass,
            moodColorClass: moodColorClass,
            strength: strength
        });

        sessionStorage.setItem('somaMoodLogs', JSON.stringify(moodLogs)); // Save to sessionStorage
        renderMoodLogs();
    }

    function renderMoodLogs() {
        moodLogEntries.innerHTML = ''; // Clear existing entries

        moodLogs.forEach(log => {
            const moodEntryDiv = document.createElement('div');
            moodEntryDiv.className = 'mood-entry';
            moodEntryDiv.innerHTML = `
                <div class="icon-wrapper ${log.moodColorClass.replace('text-', '')}-bg-small">
                    <i class="${log.iconClass}"></i>
                </div>
                <div class="mood-details">
                    <div class="mood-label-time">
                        <p>${log.mood}</p>
                        <p>${log.time}</p>
                    </div>
                    <div class="progress-bar-background">
                        <div class="progress-bar-fill ${log.moodColorClass.replace('text-', '')}-fill" style="width: ${log.strength}%"></div>
                    </div>
                </div>
            `;
            moodLogEntries.appendChild(moodEntryDiv);
        });
    }
});
