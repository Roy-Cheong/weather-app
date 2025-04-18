const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

//Serve static files from the "public" folder (HTML, CSS, JS)
app.use(express.static("public"));

//Simple API route to get weather for a given city
app.get("/api/weather", async(req, res) =>{
    const city = req.query.city;
    if(!city){
        return res.status(400).json({error: "City is required"});
    }

    try {
        //This 1 gets coordinates from RESTCountries API
        const geoRes = await fetch(`https://restcountries.com/v3.1/capital/${encodeURIComponent(city)}`);
        const [geoData] = await geoRes.json();
        const [lat,lon] = geoData.latlng;

        //This 1 fetches the weather forecast from Open-Meteo API
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
        const weatherData = await weatherRes.json();

        //Sends responses to the frontend
        res.json({
            city,
            lat,
            lon,
            forecast: weatherData.daily
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch weather data"});
    }
});

//This 1 starts the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});