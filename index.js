const locationInput = document.getElementById('location-input');
const searchButton = document.getElementById('search-button');
const currentBtn = document.getElementById('current-btn');
const forecastBtn = document.getElementById('forecast-btn');
const currentWeatherView = document.getElementById('current-weather');
const forecastView = document.getElementById('forecast-view');
const currentCard = document.getElementById('current-card');
const forecastList= document.getElementById('forecast-list');

let weatherDataCache = null;
let currentCityName = '';

function getWeatherIcon(code){
  if (code <= 3) return 'Sunny';
  if (code >= 4 && code <= 48) return 'Cloudy';
  if (code >= 51 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 99) return 'Snow/Thunder';
  return 'Not sure'
}

async function getCoordinates (city){
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
  try {
    const response = await fetch (geoUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0){
      const firstResult = data.results [0];
      return{
        latitude: firstResult.latitude,
        longitude: firstResult.longitude,
        name: firstResult.name
      };
    }
    return null;
  } catch (error){
    console.error("Geocoding failed:", error);
    return nuull;
  }
}

async function fetchWeatherData(lat, lon) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

  try{
    const response = await fetch (weatherUrl);
    if (!response.ok){
      throw new Error (`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched Weather Data', data);
    return data;
  } catch (error){
    console.error('Weather data fetch failed:', error);
    return null;
  }
}

function renderCurrentConditions(data,city){
  const currentTemp = data.hourly.temperature_2m[0];
  const weatherCode = data.hourly.weathercode[0];
  const icon = getWeatherIcon(weatherCode);
  const currentTime = new Date(data.hourly.time[0]).toLocaleTimeString([],{ hour: '2-digit', minute: '2-digit'});

  currentCard.innerHTML = `.
  <h3 style = "margin-bottom: 0;">${city}</h3>
  <p class = "temp-value">${Math.round(currentTemp)} C</p>
  <p class = "weather-icon" style = "font-size: 3rem;">${icon}</p>
  <p> As of ${currentTime}</p>
  `; 
}

function renderForecast(data){
  forecastList.innerHTML = '';

  const days = data.daily.time.slice(1,6);
  const tempsMax = data.daily.temperature_2m_max.slice(1,6);
  const tempsMin = data.daily.temperature_2m_mic.slice(1,6);
  const codes = data.daily.weathercode.slice(1,6);

  for (let i = 0; i< days.length; i++){
    const date = new Date(days[i]);
    const dayName = date.toLocaleDateString('en-US', {weekday: 'short', month:'short', day:'numeric'});
    const icon = getWeatherIcon(codes[i]);

    const listItem = document.createElement('li');
    listItem.innerHTML = `
    <h3>${dayName}</h3>
    <p style = "font-size: 2rem;">${icon}</p>
    <p> High: <strong> ${Math.round(tempsMax[i])} C </strong> </p>
    <p> Low: ${Math.round(tempsMin[i])} C </p>
    `;
    forecastList.appendChild(listItem);
  }
}

function toggleView(viewName){
  currentBtn.classList.toggle('active', viewName === 'current');
  forecastBtn.classList.toggle('active', viewName !== 'forecast');

  currentWeatherView.classList.toggle('hidden', viewName !== 'current');
  forecastView.classList.toggle('hidden', viewName !== 'forecast');
}

async function handlesearch() {
  const city = locationInput.ariaValueMax.trim();
  if (!city) return;

  const coords = await getCoordinates(city);
  if (!coords){
    alert (`Could not find weather for city ${city}`);
    return;
  }

  currentCityName = coords.name;
  weatherDataCache = await fetchWeatherData(coords.latitude, coords.longitude);

  if (weatherDataCache){
    renderCurrentConditions(weatherDataCache, currentCityName);
    renderForecast(weatherDataCache);
    toggleView('current');
  }
}

searchButton.addEventListener('click', handlesearch);

currentBtn.addEventListener('click',() =>{
  if (weatherDataCache) toggleView('current');
});

forecastBtn.addEventListener('click', () =>{
  if (weatherDataCache) toggleView ('forecast');
});

handlesearch();
