
const FIREBASE_DB_URL =
  "https://zafisat-a2653-default-rtdb.asia-southeast1.firebasedatabase.app";

function updateClock() {
  const now = new Date();
  const hours = now.getHours() % 12 || 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourHand = document.querySelector(".hours");
  const minuteHand = document.querySelector(".minutes");
  const secondHand = document.querySelector(".seconds");
  const dateDisplay = document.getElementById("date-display");

  if (hourHand) {
    hourHand.style.transform =
      `rotate(${hours * 30 + minutes * 0.5 + seconds / 120}deg)`;
  }
  if (minuteHand) {
    minuteHand.style.transform =
      `rotate(${minutes * 6 + seconds * 0.1}deg)`;
  }
  if (secondHand) {
    secondHand.style.transform = `rotate(${seconds * 6}deg)`;
  }
  if (dateDisplay) {
    dateDisplay.innerText = now.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
}

function getLocation() {
  const element = document.getElementById("location");
  if (!element) return;

  if (!navigator.geolocation) {
    element.innerText = "Geolocation is not supported.";
    return;
  }

  navigator.geolocation.getCurrentPosition(async position => {
    try {
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      if (!response.ok) throw new Error("Location lookup failed");

      const data = await response.json();
      const a = data.address || {};
      const place = a.city || a.town || a.village || a.county;
      element.innerText = "📍 " +
        [place, a.state, a.country].filter(Boolean).join(", ");
    } catch {
      element.innerText = "Location data unavailable.";
    }
  }, () => {
    element.innerText = "Location permission denied or unavailable.";
  });
}

async function readSensor(path) {
  const response = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
  if (!response.ok) throw new Error(`Firebase HTTP ${response.status}`);
  return response.json();
}

async function updateSensor(elementId, path, decimals = 1) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const value = await readSensor(path);
    element.innerText =
      typeof value === "number" ? value.toFixed(decimals) :
      value === null ? "N/A" : String(value);
  } catch (error) {
    element.innerText = "Unavailable";
    console.error(`Error reading ${path}:`, error);
  }
}

async function fetchSensorData() {
  await Promise.all([
    updateSensor("temperature", "DHT22/Temperature", 1),
    updateSensor("humidity", "DHT22/Humidity", 1)
  ]);

  const pressure = document.getElementById("pressure");
  if (pressure) pressure.innerText = "Not connected";

  const rain = document.getElementById("rain-status");
  if (rain) rain.innerText = "Not connected";
}

document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  getLocation();
  fetchSensorData();
  setInterval(fetchSensorData, 5000);
});
