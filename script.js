// ----------------------------------
// JavaScript: 최종 통합 버전 (모든 기능 포함)
// ----------------------------------

// Global state to store weather data and current unit
let currentWeatherData = null;
let currentUnit = 'C'; 

// HTML 요소 및 Body 요소 가져오기
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const tempDisplay = document.getElementById('temp');
const descriptionDisplay = document.getElementById('description');
const cityDisplay = document.getElementById('cityDisplay');
const errorDisplay = document.getElementById('errorMessage');
const unitToggle = document.getElementById('unitToggle');
const forecastContainer = document.getElementById('forecastContainer');
const weatherApp = document.querySelector('.weather-app');
const clothingRecommendationDisplay = document.getElementById('clothingRecommendation');
const bodyElement = document.body; // body 요소


// ★★★ 사용자님의 실제 API 키를 반영했습니다! ★★★
const API_KEY = "6d8fe32823d8390520bec80b1d47f957"; 
const DUMMY_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const DUMMY_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"; 
const DUMMY_GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct";

// ----------------------------------
// Helper Functions (보조 함수)
// ----------------------------------

/**
 * 한국어 설명(description)을 CSS 클래스에 매핑하는 함수 (동적 배경용)
 */
function getWeatherClass(description) {
    if (description.includes('맑음') || description.includes('화창')) {
        return 'clear-sky';
    } else if (description.includes('구름') || description.includes('흐림')) {
        return 'clouds';
    } else if (description.includes('비') || description.includes('소나기')) {
        return 'rain';
    } else if (description.includes('눈')) {
        return 'snow';
    } else if (description.includes('안개') || description.includes('연무')) {
        return 'mist';
    } else if (description.includes('천둥') || description.includes('폭풍')) {
        return 'thunderstorm';
    }
    return 'default';
}

/**
 * 도시의 시간대(timezone offset)를 사용하여 현재 시각을 계산하고 포맷합니다.
 */
function getFormattedTime(timezoneOffset) {
    const localTime = new Date(Date.now() + timezoneOffset * 1000);
    const options = {
        month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', 
        hour12: true, timeZone: 'UTC'
    };
    return localTime.toLocaleTimeString('ko-KR', options);
}

/**
 * OpenWeatherMap 아이콘 코드를 기반으로 URL을 반환합니다.
 */
function getIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// ★★★ 기온별 옷차림 추천 로직 추가 ★★★
/**
 * 섭씨 온도(tempC)를 기준으로 옷차림을 추천하는 함수
 * (제공된 이미지 자료를 기반으로 작성됨)
 * @param {number} tempC 현재 섭씨 온도
 * @returns {string} 추천 옷차림 문구
 */
function getClothingRecommendation(tempC) {
    if (tempC >= 28) {
        return "28°C 이상: 민소매, 반팔, 반바지, 원피스 (가볍게 입으세요!)";
    } else if (tempC >= 23) { // 27°C ~ 23°C
        return "23°C ~ 27°C: 반팔, 얇은 셔츠, 반바지, 면바지";
    } else if (tempC >= 20) { // 22°C ~ 20°C
        return "20°C ~ 22°C: 얇은 가디건, 긴팔, 면바지, 청바지";
    } else if (tempC >= 17) { // 19°C ~ 17°C
        return "17°C ~ 19°C: 얇은 니트/맨투맨, 가디건, 청바지";
    } else if (tempC >= 12) { // 16°C ~ 12°C
        return "12°C ~ 16°C: 자켓, 가디건, 야상, 스타킹, 청바지, 면바지";
    } else if (tempC >= 9) { // 11°C ~ 9°C
        return "9°C ~ 11°C: 자켓, 트렌치코트, 야상, 니트, 청바지, 스타킹";
    } else if (tempC >= 5) { // 8°C ~ 5°C
        return "5°C ~ 8°C: 코트, 가죽자켓, 히트텍, 니트, 레깅스";
    } else if (tempC < 5) { // ★★★ 4°C 이하 조건을 명시적으로 처리 ★★★
        return "4°C 이하: 패딩, 두꺼운 코트, 목도리, 기모제품 (따뜻하게 입으세요!)";
    }
    // 모든 조건에 해당하지 않을 경우 (null/undefined/이상한 값)
    return "온도 정보를 가져올 수 없습니다.";
}
// ----------------------------------------

/**
 * 오류 발생 시 콘솔에 출력하고 사용자에게 표시하는 함수
 */
function handleError(error) {
    console.error("날씨 정보를 가져오는 중 오류 발생:", error);
    errorDisplay.textContent = `오류: ${error.message}`;
    cityDisplay.textContent = '';
    tempDisplay.textContent = '';
    descriptionDisplay.textContent = '';
    forecastContainer.innerHTML = '';
    clothingRecommendationDisplay.textContent = '';
    currentWeatherData = null;
    weatherApp.className = 'weather-app'; // 앱 배경 초기화
    bodyElement.className = ''; // body 배경 초기화
    
    // 현재 시간 표시 요소 제거 (있다면)
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) dateTimeElement.remove();
}

// ----------------------------------
// 1. 필수: 섭씨/화씨 단위 전환 로직
// ----------------------------------

function toFahrenheit(celsius) { return (celsius * 9 / 5) + 32; }

function updateTemperatureDisplay() {
    if (!currentWeatherData) return;
    let tempC = currentWeatherData.tempC;
    let tempF = toFahrenheit(tempC);
    if (currentUnit === 'C') {
        tempDisplay.textContent = `${Math.round(tempC)}°C`;
    } else {
        tempDisplay.textContent = `${Math.round(tempF)}°F`;
    }
    updateForecastTemperature();
}

function updateForecastTemperature() {
    const cards = forecastContainer.querySelectorAll('.forecast-card');
    cards.forEach(card => {
        const tempMaxC = parseFloat(card.dataset.tempMaxC);
        const tempMinC = parseFloat(card.dataset.tempMinC);
        let maxTemp = tempMaxC;
        let minTemp = tempMinC;
        let unit = 'C';
        if (currentUnit === 'F') {
            maxTemp = toFahrenheit(tempMaxC);
            minTemp = toFahrenheit(tempMinC);
            unit = 'F';
        }
        card.querySelector('.temp-max').textContent = `${Math.round(maxTemp)}°${unit}`;
        card.querySelector('.temp-min').textContent = `/${Math.round(minTemp)}°${unit}`;
    });
}

unitToggle.addEventListener('click', () => {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    updateTemperatureDisplay();
});


// ----------------------------------
// 2. 필수: 3일 단기 예보 카드 생성 (좌표 기반 호출)
// ----------------------------------

async function getForecastByCoords(lat, lon) {
    const url = `${DUMMY_FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`예보 정보를 찾을 수 없습니다. (API 응답 코드: ${response.status})`);
        }
        const data = await response.json();
        
        const forecastList = data.list;
        const dailyForecasts = {};
        for (const item of forecastList) {
            const date = item.dt_txt.split(' ')[0];
            const temp = item.main.temp;
            const description = item.weather[0].description;
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = { min: temp, max: temp, description: description };
            } else {
                dailyForecasts[date].min = Math.min(dailyForecasts[date].min, temp);
                dailyForecasts[date].max = Math.max(dailyForecasts[date].max, temp);
            }
        }
        const dates = Object.keys(dailyForecasts).sort();
        const nextThreeDays = dates.slice(1, 4); 
        displayForecast(nextThreeDays, dailyForecasts);
    } catch (error) {
        console.warn("예보 정보를 가져오는 중 경고 발생:", error.message);
        forecastContainer.innerHTML = '<p class="error-message">예보 정보를 가져오지 못했습니다.</p>';
    }
}

function displayForecast(dates, dailyForecasts) {
    forecastContainer.innerHTML = '';
    const weekday = ['일', '월', '화', '수', '목', '금', '토'];
    dates.forEach(dateString => {
        const forecast = dailyForecasts[dateString];
        const date = new Date(dateString);
        const dayName = weekday[date.getDay()];
        const card = document.createElement('div');
        card.classList.add('forecast-card');
        card.dataset.tempMaxC = forecast.max;
        card.dataset.tempMinC = forecast.min;
        card.innerHTML = `
            <div class="day">${dayName}요일</div>
            <div class="date">${dateString.substring(5).replace('-', '/')}</div>
            <div class="status">${forecast.description}</div>
            <div class="temp-max"></div>
            <div class="temp-min"></div>
        `;
        forecastContainer.appendChild(card);
    });
    updateForecastTemperature();
}

// ----------------------------------
// 3. 메인 로직: 현재 날씨 정보 가져오기 (좌표 기반 호출)
// ----------------------------------

/**
 * 위도/경도를 기반으로 현재 날씨 정보를 가져와 표시 및 모든 시각/동적 효과 적용
 */
async function getWeatherByCoords(lat, lon, isGeoLocation = false) {
    errorDisplay.textContent = ''; 
    const weatherUrl = `${DUMMY_WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    
    try {
        const response = await fetch(weatherUrl);

        if (!response.ok) {
            // 이전에 city가 정의되지 않아 발생하는 오류를 수정했습니다.
            const city = currentWeatherData ? currentWeatherData.name : '알 수 없는 위치';
            throw new Error(`날씨 정보를 찾을 수 없습니다. (API 응답 코드: ${response.status})`);
        }

        const data = await response.json();
        
        // ★★★ 현재 시간 계산 및 주/야간 모드 판단 ★★★
        const currentDateTimeText = getFormattedTime(data.timezone);
        const iconCode = data.weather[0].icon;
        const isDay = iconCode.slice(-1) === 'd'; 
        
        currentWeatherData = {
            tempC: data.main.temp,
            name: data.name,
            description: data.weather[0].description,
            iconCode: iconCode
        };
        
        // 1. 현재 날짜/시간 표시 요소 처리
        let dateTimeElement = document.getElementById('currentDateTime');
        if (!dateTimeElement) {
            dateTimeElement = document.createElement('p');
            dateTimeElement.id = 'currentDateTime';
            dateTimeElement.classList.add('date-time');
            cityDisplay.parentNode.insertBefore(dateTimeElement, cityDisplay.nextSibling);
        }
        dateTimeElement.textContent = currentDateTimeText;

        // 2. 주/야간 모드 클래스 적용 (body 배경 조정용)
        bodyElement.className = isDay ? 'day-mode' : 'night-mode';
        
        // 3. 현재 날씨 아이콘 표시
        const weatherIconHtml = `<img src="${getIconUrl(iconCode)}" alt="${currentWeatherData.description} 아이콘" class="weather-icon">`;
        descriptionDisplay.innerHTML = `${weatherIconHtml} ${currentWeatherData.description}`;

        // ★★★ 옷차림 추천 로직 실행 및 표시 ★★★
        const recommendedClothes = getClothingRecommendation(data.main.temp);
        clothingRecommendationDisplay.textContent = `👕 ${recommendedClothes}`;
        
        // 4. 동적 배경 클래스 적용 (weather-app)
        const statusClass = getWeatherClass(currentWeatherData.description);
        weatherApp.className = 'weather-app'; 
        weatherApp.classList.add(statusClass);
        
        // 5. 현재 날씨 및 온도 표시
        cityDisplay.textContent = `${currentWeatherData.name}${isGeoLocation ? ' (현재 위치)' : ''}`;
        updateTemperatureDisplay(); 

        // 6. 예보 정보 가져오기 (좌표 기반)
        getForecastByCoords(lat, lon);
        
    } catch (error) {
        handleError(error);
    }
}


// ----------------------------------
// 4. 메인 검색 함수: Geocoding으로 좌표 획득 후 getWeatherByCoords 호출
// ----------------------------------

/**
 * 도시 이름 (한국어 또는 영어)을 기반으로 좌표를 획득하여 날씨를 표시
 */
async function getWeather(city) {
    errorDisplay.textContent = ''; 
    
    if (!city) {
        errorDisplay.textContent = "도시 이름을 입력해 주세요.";
        return;
    }

    const geoUrl = `${DUMMY_GEOCODING_URL}?q=${city}&limit=1&appid=${API_KEY}`;
    
    try {
        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
            throw new Error(`도시 검색에 실패했습니다. (API 응답 코드: ${geoResponse.status})`);
        }
        
        const geoData = await geoResponse.json();
        
        if (geoData.length === 0) {
            throw new Error(`'${city}'에 해당하는 도시를 찾을 수 없습니다. 철자를 확인해 주세요.`);
        }
        
        const lat = geoData[0].lat;
        const lon = geoData[0].lon;

        getWeatherByCoords(lat, lon);
        
    } catch (error) {
        handleError(error);
    }
}


// ----------------------------------
// 5. Geolocation API (위치 감지)
// ----------------------------------

function getLocationAndWeather() {
    if (navigator.geolocation) {
        cityDisplay.textContent = '현재 위치 감지 중...'; 
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoords(lat, lon, true); 
            },
            (error) => {
                console.warn(`Geolocation 오류 (${error.code}): ${error.message}`);
                errorDisplay.textContent = "위치 정보 감지 권한이 거부되어 서울의 날씨를 표시합니다.";
                getWeather('Seoul'); 
            }
        );
    } else {
        errorDisplay.textContent = "이 브라우저에서는 Geolocation이 지원되지 않습니다. 서울의 날씨를 표시합니다.";
        getWeather('Seoul'); 
    }
}

// ----------------------------------
// 6. 이벤트 리스너 및 초기화
// ----------------------------------
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    getWeather(city);
});
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        getWeather(city);
    }
});
getLocationAndWeather();