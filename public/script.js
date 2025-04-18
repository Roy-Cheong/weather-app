// === GLOBAL SETUP ===
const toggle = document.getElementById("darkModeToggle");
const modeLabel = document.getElementById("modeLabel");
const unitToggle = document.getElementById("unitToggle");
const unitLabel = document.getElementById("unitLabel");
let currentUnit = localStorage.getItem("tempUnit") || "C";

// === ON LOAD ===
document.addEventListener("DOMContentLoaded", () => {
    // Dark mode
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark");
        toggle.checked = true;
        modeLabel.textContent = "🌙 Dark Mode";
    }

    // Temperature unit
    if (currentUnit === "F") {
        unitToggle.checked = true;
        unitLabel.textContent = "°F";
    }

    loadSearchHistory();
    loadFavoriteCities();
});

// === TOGGLE LISTENERS ===
toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", toggle.checked);
    localStorage.setItem("darkMode", toggle.checked ? "enabled" : "disabled");
    modeLabel.textContent = toggle.checked ? "🌙 Dark Mode" : "🌞 Light Mode";
});

unitToggle.addEventListener("change", () => {
    currentUnit = unitToggle.checked ? "F" : "C";
    unitLabel.textContent = currentUnit === "F" ? "°F" : "°C";
    localStorage.setItem("tempUnit", currentUnit);
    if (window.weatherData) renderWeather(window.weatherData);
});

// === SEARCH HANDLER ===
document.querySelector("#searchBtn").addEventListener("click", () => {
    const city = document.querySelector("#cityInput").value.trim();
    if (!city) {
    document.querySelector("#weatherResult").innerHTML = "Please enter a city.";
    return;
    }

    showLoading();
    fetchWeather(city);
});

// === API CALL ===
async function fetchWeather(city) {
    try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    if (!data || data.error || !data.city) {
        resultDiv.innerHTML = `

          <p style="color: #dc2626; font-weight: 500;">
            ⚠️ City not found. Please enter a valid city name like <i>Dublin</i>, <i>Tokyo</i>, or <i>London</i>.
          </p>
        
        `;
        
        if (window.weatherChart?.destroy) {
        window.weatherChart.destroy();
        }

        return;
      }
      

    window.weatherData = data;
    saveToHistory(city);
    renderWeather(data);
    loadSearchHistory();
    } catch (err) {
    document.querySelector("#weatherResult").innerHTML = "Error fetching weather data.";
    console.error(err);
    }
}

// === RENDER WEATHER + CHART ===
function renderWeather(data) {
    const resultDiv = document.querySelector("#weatherResult");
    const ctx = document.getElementById("weatherChart").getContext("2d");
    const unitSymbol = currentUnit === "F" ? "°F" : "°C";

    const temps = data.forecast.temperature_2m_max.map(convertTemp);

    resultDiv.innerHTML = `
    <div class="weather-header">
    <h2 class="city-heading">${data.city}</h2>
    <span id="favToggle" class="fav-star">${isFavorite(data.city) ? "⭐" : "☆"}</span>
    </div>

    <p><strong>📍 Coordinates: </strong> ${data.lat}, ${data.lon}</p>
    <h3> 7-Day Forecast </h3>
    <ul class="forecast-list">
        ${data.forecast.time.map((day, i) => {
        const temp = convertTemp(data.forecast.temperature_2m_max[i]);
        const rain = data.forecast.precipitation_sum[i];
        const icon = getWeatherIcon(temp, rain);
        return `<li>${day}: ${icon} ${temp}${unitSymbol}, ${rain}mm</li>`;
        }).join("")}
    </ul>
    `;
    resultDiv.classList.remove("fade-in"); // reset
    void resultDiv.offsetWidth; // force reflow
    resultDiv.classList.add("fade-in");

    document.getElementById("favToggle").addEventListener("click", () => {
    toggleFavorite(data.city);
    renderWeather(data); // refresh star
    });

    if (window.weatherChart?.destroy) window.weatherChart.destroy();

    window.weatherChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: data.forecast.time,
        datasets: [{
        label: `Max Temp (${unitSymbol})`,
        data: temps,
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.1)",
        fill: true,
        tension: 0.3
        }]
    },
    options: {
        responsive: true,
        plugins: {
        title: {
            display: true,
            text: `7-Day Forecast for ${data.city}`
        }
        }
    }
    });
}

// === HELPER FUNCTIONS ===
function convertTemp(tempC) {
    return currentUnit === "F" ? (tempC * 9/5 + 32).toFixed(1) : tempC;
}

function getWeatherIcon(temp, rain) {
    if (rain > 10) return "🌧️";
    if (rain > 2) return "🌦️";
    if (temp > 28) return "☀️";
    if (temp > 20) return "🌤️";
    if (temp < 10) return "❄️";
    return "⛅";
}

function showLoading() {
    document.querySelector("#weatherResult").innerHTML = `
        <div class="loader-container">
        <div class="loader"></div>
        <p>Loading weather data...</p>
        </div>
    `;
}

// === SEARCH HISTORY ===
function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    city = city.toLowerCase();
    if (!history.includes(city)) {
        history.push(city);
        localStorage.setItem("searchHistory", JSON.stringify(history));
    }
}

function loadSearchHistory() {
    const historyList = document.getElementById("historyList");
    const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    historyList.innerHTML = "";

    history.slice().reverse().forEach(city => {
        const li = document.createElement("li");
        li.textContent = city.charAt(0).toUpperCase() + city.slice(1);
        li.addEventListener("click", () => {
        document.querySelector("#cityInput").value = city;
        document.querySelector("#searchBtn").click();
        });
        historyList.appendChild(li);
    });
}

function isFavorite(city) {
    const favs = JSON.parse(localStorage.getItem("favoriteCities")) || [];
    return favs.includes(city.toLowerCase());
}
  
function toggleFavorite(city) {
    let favs = JSON.parse(localStorage.getItem("favoriteCities")) || [];
    city = city.toLowerCase();

    if (favs.includes(city)) {
        favs = favs.filter(c => c !== city);
    } else {
        favs.push(city);
    }

    localStorage.setItem("favoriteCities", JSON.stringify(favs));
    loadFavoriteCities();
}

function loadFavoriteCities() {
    const favList = document.getElementById("favoriteList");
    const favs = JSON.parse(localStorage.getItem("favoriteCities")) || [];
  
    favList.innerHTML = "";
    favs.slice().reverse().forEach(city => {
      const li = document.createElement("li");
      li.textContent = city.charAt(0).toUpperCase() + city.slice(1);
      li.addEventListener("click", () => {
        document.querySelector("#cityInput").value = city;
        document.querySelector("#searchBtn").click();
      });
      favList.appendChild(li);
    });
  }
  
  
