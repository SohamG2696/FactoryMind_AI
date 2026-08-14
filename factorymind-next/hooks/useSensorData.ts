import { useState, useEffect } from "react";

interface SensorData {
  temp: string;
  rpm: number;
  energy: string;
  vibration: string;
}

const vibrationLevels = ["Normal", "Low", "Medium", "High"];

export function useSensorData(): SensorData {
  const [data, setData] = useState<SensorData>({
    temp: "72°C",
    rpm: 1450,
    energy: "126 kWh",
    vibration: "Normal",
  });

  useEffect(() => {
    const id = setInterval(() => {
      setData({
        temp: Math.floor(Math.random() * 15 + 65) + "°C",
        rpm: Math.floor(Math.random() * 300 + 1300),
        energy: Math.floor(Math.random() * 30 + 115) + " kWh",
        vibration:
          vibrationLevels[Math.floor(Math.random() * vibrationLevels.length)],
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return data;
}
