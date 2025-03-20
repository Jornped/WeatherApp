const apiKey = "";  // It's free but still don't want to share it 

const searchButton = document.querySelector("#search-button");
const searchInput = document.querySelector("#search-input");

const tempLabel = document.querySelector(".temp");
const windLabel = document.querySelector(".wind");
const humidityLabel = document.querySelector(".humidity");
const cityLabel = document.querySelector(".city");
const weatherIcon = document.querySelector(".weather-icon");


const weatherIcons = {
    "01d": "./images/clear.png",
    "01n": "./images/clear.png",
    "02d": "./images/clouds.png",
    "02n": "./images/clouds.png",
    "03d": "./images/clouds.png",
    "03n": "./images/clouds.png",
    "04d": "./images/clouds.png",
    "04n": "./images/clouds.png",
    "09d": "./images/drizzle.png",
    "09n": "./images/drizzle.png",
    "10d": "./images/rain.png",
    "10n": "./images/rain.png",
    "11d": "./images/rain.png",
    "11n": "./images/rain.png",
    "13d": "./images/snow.png",
    "13n": "./images/snow.png",
    "50d": "./images/mist.png",
    "50n": "./images/mist.png"
};

document.addEventListener("DOMContentLoaded", () => {
    restoreSession();
});

searchButton.addEventListener("click", async () => {
    let coordinates = await getCoordinates(searchInput.value);
    if (coordinates)
        await getCityWeatherByCoord(coordinates.lat, coordinates.lon);
    else
        console.log("error");
});

async function getCoordinates(cityName) {
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`);
        const data = await response.json();
        if (data.length === 0)
            throw new Error("Город не найден");
        return { lat: data[0].lat, lon: data[0].lon };
    }
    catch (error) {
        console.error("Ошибка в getCoordinates:", error.message);
        return null;
    }
}

async function getCityWeatherByCoord(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    const weather = await response.json();

    const weatherCode = weather.weather[0].icon;
    weatherIcon.src = weatherIcons[weatherCode] || "./images/clear.png";

    const humidity = Math.round(weather.main.humidity);
    const wind = Math.round(weather.wind.speed);
    const temperature = Math.round(weather.main.temp);
    const cityName = await getCityFromCoords(lat, lon);

    tempLabel.textContent = `${temperature}°C`;
    windLabel.textContent = `${wind} m/s`;
    humidityLabel.textContent = `${humidity}%`;
    cityLabel.textContent = cityName;

    searchInput.value = "";

    saveToLocalStorage(cityName, temperature, humidity, wind, weatherIcon.src);
}

function saveToLocalStorage(city, temp, humidity, wind, icon) {
    localStorage.setItem("weatherData", JSON.stringify({ city, temp, humidity, wind, icon }));
}

function restoreSession() {
    const data = JSON.parse(localStorage.getItem("weatherData"));
    if (!data) {
        console.warn("Нет сохраненных данных.");
        return;
    }

    tempLabel.textContent = `${data.temp}°C`;
    windLabel.textContent = `${data.wind} m/s`;
    humidityLabel.textContent = `${data.humidity}%`;
    cityLabel.textContent = data.city;
    weatherIcon.src = data.icon || "./images/clear.png";
}

// OpenWeather does not always return the correct city name (e.g., "Posëlok Rabochiy" instead of "Yekaterinburg"),
// because it takes the name from the nearest weather station. 
// To get the actual city name, I had to use OpenStreetMap API.
async function getCityFromCoords(lat, lon) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();

    return data.address.city || data.address.county || data.address.town || data.address.village || "Unknown City";
}
