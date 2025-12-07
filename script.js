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
const bodyElement = document.body;
const quickCityButtons = document.querySelectorAll('.quick-city-btn');


// 실제 API 키를 반영
const API_KEY = "6d8fe32823d8390520bec80b1d47f957"; 
const DUMMY_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const DUMMY_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"; 
const DUMMY_GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct";
const DUMMY_AIR_POLLUTION_URL = "https://api.openweathermap.org/data/2.5/air_pollution"; 

// 모달 요소 추가
const aqiModal = document.getElementById('aqiModal');
const modalTitle = document.getElementById('modalTitle');
const modalValue = document.getElementById('modalValue');
const modalCloseBtn = aqiModal ? aqiModal.querySelector('.close-btn') : null;


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
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (timezoneOffset * 1000));

    const options = {
        month: 'long', 
        day: 'numeric', 
        weekday: 'long', // ★★★ 요일 추가 ★★★
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
    };
    
    // 한국어 로케일을 사용하여 포맷
    return localTime.toLocaleDateString('ko-KR', options);
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
    } else if (tempC < 5) { // 4°C 이하 조건을 명시적으로 처리
        return "4°C 이하: 패딩, 두꺼운 코트, 목도리, 기모제품 (따뜻하게 입으세요!)";
    }
    return "온도 정보를 가져올 수 없습니다.";
}
// ----------------------------------------

/**
 * OpenWeatherMap의 AQI 지수(1-5)를 한글 상태로 변환
 */
function getAqiInfo(aqi) {
    switch(aqi) {
        case 1: return { status: "매우 좋음", class: "aqi-vgood" };
        case 2: return { status: "좋음", class: "aqi-good" };
        case 3: return { status: "보통", class: "aqi-moderate" };
        case 4: return { status: "나쁨", class: "aqi-unhealthy" };
        case 5: return { status: "매우 나쁨", class: "aqi-very-unhealthy" }; 
        default: return { status: "알 수 없음", class: "aqi-unknown" };
    }
}

/**
 * 현재 시간을 '날짜 요일 시간' 형식으로 포맷하는 함수 (요일 추가)
 * @param {number} timezoneOffset - UTC로부터의 시간대 오프셋 (초)
 */
function getFormattedTime(timezoneOffset) {
    const now = new Date();
    // UTC 시간을 구한 후, timezoneOffset을 더해 목표 도시의 로컬 시간을 구합니다.
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (timezoneOffset * 1000));

    const options = {
        month: 'long', 
        day: 'numeric', 
        weekday: 'long', // 요일
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true // 오전/오후
    };
    
    // toLocaleString을 사용하여 날짜, 요일, 시간을 모두 출력
    return localTime.toLocaleString('ko-KR', options); 
}

/**
 * 오류 발생 시 콘솔에 출력하고 사용자에게 표시하는 함수
 */
function handleError(error) {
    console.error("날씨 정보를 가져오는 중 오류 발생:", error);
    errorDisplay.textContent = `오류: ${error.message}`;
    
    // 표시된 모든 정보 초기화
    cityDisplay.textContent = '';
    tempDisplay.textContent = '';
    descriptionDisplay.textContent = '';
    forecastContainer.innerHTML = '';
    clothingRecommendationDisplay.textContent = '';
    
    // cityDisplay 내부에 동적으로 삽입된 날짜/시간 요소 제거
    // 해당 로직은 cityDisplay.innerHTML = '' 으로 이미 처리됩니다.
    
    currentWeatherData = null;
    weatherApp.className = 'weather-app'; 
    bodyElement.className = ''; 
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
// 미세먼지 정보 가져오기 (수치 툴팁 추가)
// ----------------------------------

/**
 * 미세먼지 수치를 가져와 툴팁(title)에 포함하여 문자열 반환
 */
async function getAirQualityByCoords(lat, lon) {
    const url = `${DUMMY_AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`대기 오염 정보를 찾을 수 없습니다.`);
        }
        
        const data = await response.json();
        const components = data.list[0].components;
        const general_aqi = data.list[0].main.aqi; 
        
        const aqiInfo = getAqiInfo(general_aqi); 
        const status = aqiInfo.status;
        const statusClass = aqiInfo.class;
        
        // PM10/PM2.5 수치 가져오기 (반올림, μg/m³)
        const pm10Value = Math.round(components.pm10 || 0); 
        const pm25Value = Math.round(components.pm2_5 || 0);
        
        const pm10Title = `미세먼지 수치: ${pm10Value} µg/m³`;
        const pm25Title = `초미세먼지 수치: ${pm25Value} µg/m³`;

        const pm10Event = `showAqiModal('미세먼지 (PM10)', ${pm10Value})`;
        const pm25Event = `showAqiModal('초미세먼지 (PM2.5)', ${pm25Value})`;

        // title 속성 대신 onClick 이벤트 삽입
        return `
            <span class="aqi-separator">|</span> 
            <span class="aqi-item" onclick="${pm10Event}" title="${pm10Title}">
                미세먼지: <span class="aqi-status ${statusClass}">${status}</span>
            </span>
            <span class="aqi-separator">|</span> 
            <span class="aqi-item" onclick="${pm25Event}" title="${pm25Title}">
                초미세먼지: <span class="aqi-status ${statusClass}">${status}</span>
            </span>
        `;
        // NOTE: aqi-item 클래스가 PM10 전체 항목을 감쌉니다.

    } catch (error) {
        console.warn("대기 오염 정보를 가져오는 중 오류 발생:", error.message);
        return ``;
    }
}

// ----------------------------------
// 모달 표시 로직 추가
// ----------------------------------

// 전역 함수로 선언하여 HTML의 onclick 속성에서 접근 가능하도록 합니다.
window.showAqiModal = (title, value) => {
    if (!aqiModal) return; 

    modalTitle.textContent = title;
    modalValue.textContent = value;
    aqiModal.style.display = 'flex';
};

// 모달 닫기 이벤트 리스너
if (modalCloseBtn) {
    modalCloseBtn.onclick = () => {
        aqiModal.style.display = 'none';
    };
}

// 모달 바깥쪽 클릭 시 닫기
window.onclick = (event) => {
    if (event.target === aqiModal) {
        aqiModal.style.display = 'none';
    }
};

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
            throw new Error(`날씨 정보를 찾을 수 없습니다. (API 응답 코드: ${response.status})`);
        }

        const data = await response.json();

        // 1. 비동기 호출 시작: 모든 API 호출을 동시에 시작 (병렬 처리)
        const airQualityPromise = getAirQualityByCoords(lat, lon);
        const forecastPromise = getForecastByCoords(lat, lon); 
        
        // 2. 핵심 데이터 추출
        const currentDateTimeText = getFormattedTime(data.timezone);
        const iconCode = data.weather[0].icon;
        const isDay = iconCode.slice(-1) === 'd'; 
        
        currentWeatherData = {
            tempC: data.main.temp,
            name: data.name,
            description: data.weather[0].description,
            iconCode: iconCode
        };

        // 3. 미세먼지 정보 대기 (HTML에 사용되어야 하므로 await)
        const airQualityText = await airQualityPromise; 
        
        // 4. ★★★ DOM 조작 ★★★
        
        // 4a. 도시 이름 및 날짜/시간 삽입 (innerHTML로 한 번에 처리)
        const cityHtml = isGeoLocation ? `${currentWeatherData.name} (현재 위치)` : currentWeatherData.name;
        cityDisplay.innerHTML = `
            ${cityHtml}
            <p id="currentDateTime" class="date-time">${currentDateTimeText}</p> 
        `;

        // 4b. 주/야간 모드, 동적 배경, 옷차림 추천 적용
        bodyElement.className = isDay ? 'day-mode' : 'night-mode';
        const statusClass = getWeatherClass(currentWeatherData.description);
        weatherApp.className = 'weather-app'; 
        weatherApp.classList.add(statusClass);

        const recommendedClothes = getClothingRecommendation(data.main.temp);
        clothingRecommendationDisplay.textContent = `👕 ${recommendedClothes}`;
        
        // 4c. 날씨 아이콘 및 미세먼지 텍스트 삽입
        const weatherIconHtml = `<img src="${getIconUrl(iconCode)}" alt="${currentWeatherData.description} 아이콘" class="weather-icon">`;
        
        descriptionDisplay.innerHTML = `
            <div class="weather-status-line">
                ${weatherIconHtml}
                <span class="weather-description-text">${currentWeatherData.description}</span>
                <span class="air-quality-inline">${airQualityText}</span>
            </div>
        `;

        // 4d. 온도 표시 업데이트
        updateTemperatureDisplay(); 

        // 5. 예보 정보 대기 및 완료
        await forecastPromise;

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

// 빠른 검색 버튼 이벤트 리스너 추가
quickCityButtons.forEach(button => {
    button.addEventListener('click', () => {
        const city = button.textContent.trim();
        // 1. 입력 필드에 도시 이름 반영
        cityInput.value = city;
        // 2. 검색 실행
        getWeather(city);
    });
});

// 초기화: 앱 시작 시 현재 위치 날씨를 가져옴
getLocationAndWeather();