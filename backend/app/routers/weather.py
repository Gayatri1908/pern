"""
Weather router — provides real-time weather via Open-Meteo (free, no API key required).
Falls back to realistic synthetic data if the API is unavailable.
"""

import httpx
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/v1/weather", tags=["weather"])


def _air_density(temp_c: float, pressure_hpa: float, humidity_pct: float) -> float:
    """Calculate air density in kg/m³ using the ideal gas law."""
    T = temp_c + 273.15
    Rd = 287.058  # J/(kg·K) for dry air
    Rv = 461.495  # J/(kg·K) for water vapor
    P = pressure_hpa * 100  # Pa
    # Saturation vapor pressure (Magnus formula)
    e_s = 610.78 * (2.71828 ** ((17.27 * temp_c) / (temp_c + 237.3)))
    e = (humidity_pct / 100) * e_s
    rho = (P - e) / (Rd * T) + e / (Rv * T)
    return round(rho, 4)


@router.get("")
async def get_weather(
    lat: float = Query(18.5204, description="Latitude"),
    lng: float = Query(73.8567, description="Longitude"),
):
    """
    Fetch live weather from Open-Meteo.
    No API key required. Returns wind speed, temperature, humidity,
    pressure, rainfall, and calculated air density for power forecasting.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": [
            "temperature_2m", "relative_humidity_2m", "rain",
            "wind_speed_10m", "wind_direction_10m",
            "surface_pressure", "weather_code"
        ],
        "wind_speed_unit": "ms",
        "forecast_days": 1,
    }

    WMO_CONDITIONS = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 48: "Icy Fog",
        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
        61: "Light Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        71: "Light Snow", 73: "Moderate Snow", 75: "Heavy Snow",
        80: "Light Showers", 81: "Moderate Showers", 82: "Violent Showers",
        95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Heavy Thunderstorm",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        current = data["current"]
        temp = current.get("temperature_2m", 27.0)
        humidity = current.get("relative_humidity_2m", 65.0)
        pressure = current.get("surface_pressure", 1013.25)
        wind_speed = current.get("wind_speed_10m", 6.5)
        wind_dir = current.get("wind_direction_10m", 180.0)
        rain = current.get("rain", 0.0)
        wmo_code = current.get("weather_code", 1)

        condition = WMO_CONDITIONS.get(int(wmo_code), "Variable Conditions")
        rho = _air_density(temp, pressure, humidity)

        return {
            "location": f"{lat:.4f}, {lng:.4f}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "wind_speed_ms": round(wind_speed, 2),
            "wind_direction_deg": round(wind_dir, 1),
            "temperature_c": round(temp, 1),
            "humidity_pct": round(humidity, 1),
            "pressure_hpa": round(pressure, 1),
            "rainfall_mm": round(rain, 2),
            "condition": condition,
            "condition_icon": "🌤",
            "air_density_kg_m3": rho,
            "source": "open-meteo.com",
        }

    except Exception as exc:
        # Return realistic synthetic fallback so dashboard still renders
        import math
        hour = datetime.now(timezone.utc).hour
        # Simulate diurnal temperature variation
        temp_synth = 28.0 + 5.0 * math.sin((hour - 14) * math.pi / 12)
        wind_synth = 4.5 + 3.0 * abs(math.sin(hour * 0.3))
        return {
            "location": f"{lat:.4f}, {lng:.4f}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "wind_speed_ms": round(wind_synth, 2),
            "wind_direction_deg": 225.0,
            "temperature_c": round(temp_synth, 1),
            "humidity_pct": 62.0,
            "pressure_hpa": 1014.2,
            "rainfall_mm": 0.0,
            "condition": "Partly Cloudy",
            "condition_icon": "⛅",
            "air_density_kg_m3": 1.165,
            "source": "synthetic-fallback",
            "note": str(exc),
        }
