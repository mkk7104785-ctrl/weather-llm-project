// ----------------------------------
// 4. JavaScript: 함수 정의 및 이벤트 연결
// ----------------------------------

// HTML 요소 가져오기
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const tempDisplay = document.getElementById('temp');
const descriptionDisplay = document.getElementById('description');
const cityDisplay = document.getElementById('cityDisplay');
const errorDisplay = document.getElementById('errorMessage');

// 더미 API 키 및 URL (실제 키로 대체해야 합니다)
const DUMMY_API_KEY = "6d8fe32823d8390520bec80b1d47f957"; 
// OpenWeatherMap API의 더미 URL 구조
const DUMMY_API_URL = "https://api.openweathermap.org/data/2.5/weather"; 

/**
 * 4-3. 오류 발생 시 콘솔에 출력하는 함수
 * @param {Error} error 발생한 오류 객체
 */
function handleError(error) {
    console.error("날씨 정보를 가져오는 중 오류 발생:", error);
    // 사용자에게도 오류 메시지 표시
    errorDisplay.textContent = `오류: ${error.message}`;
    cityDisplay.textContent = '';
    tempDisplay.textContent = '';
    descriptionDisplay.textContent = '';
}

/**
 * 4-1. fetch API를 사용하여 OpenWeatherMap (더미 URL 사용)을 호출하는 로직
 * @param {string} city 검색할 도시 이름
 */
async function getWeather(city) {
    // 이전 오류 메시지 초기화
    errorDisplay.textContent = ''; 

    if (!city) {
        errorDisplay.textContent = "도시 이름을 입력해 주세요.";
        return;
    }

    // 더미 URL: 실제 API 호출을 위해서는 'YOUR_DUMMY_API_KEY'를 발급받은 키로 대체해야 합니다.
    const url = `${DUMMY_API_URL}?q=${city}&appid=${DUMMY_API_KEY}&units=metric&lang=kr`;
    
    try {
        const response = await fetch(url);

        if (!response.ok) {
            // HTTP 오류 처리 (예: 404 도시를 찾을 수 없음)
            const errorData = await response.json();
            throw new Error(`도시 정보를 찾을 수 없습니다: ${city}. (API 응답 코드: ${response.status})`);
        }

        const data = await response.json();
        
        // 날씨 정보를 HTML 요소에 표시
        cityDisplay.textContent = `${data.name}`;
        tempDisplay.textContent = `${Math.round(data.main.temp)}°C`;
        descriptionDisplay.textContent = `${data.weather[0].description}`;

        console.log("날씨 데이터 수신 성공:", data); // 디버깅용
        
    } catch (error) {
        // 네트워크 오류 또는 JSON 파싱 오류 처리
        handleError(error);
    }
}

// ----------------------------------
// 4-2. 검색 버튼 클릭 시 getWeather() 함수 실행 이벤트 리스너 연결
// ----------------------------------

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    getWeather(city);
});

// 엔터 키 입력 시에도 검색 실행 (추가 기능)
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        getWeather(city);
    }
});

// 초기 로딩 시 기본 도시의 날씨를 가져올 수도 있습니다 (선택 사항)
// getWeather('Seoul');