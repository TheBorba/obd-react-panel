import { useState, useEffect, useCallback } from 'react';
import { OBDMetrics } from '@/types/obd';

export interface SimulatorConfig {
  updateInterval: number; // ms between updates
  drivingMode: 'idle' | 'city' | 'highway' | 'track';
  maxRpm: number;
  gearRatios: number[];
  temperatureRange: { min: number; max: number };
}

const DEFAULT_CONFIG: SimulatorConfig = {
  updateInterval: 50, // 20Hz for smooth animations
  drivingMode: 'city',
  maxRpm: 8000,
  gearRatios: [3.5, 2.0, 1.5, 1.2, 1.0, 0.8], // 6-speed transmission
  temperatureRange: { min: 40, max: 95 },
};

export function useOBDSimulator(
  isMocking: boolean,
  config: Partial<SimulatorConfig> = {}
): OBDMetrics & { gear: number; drivingMode: string } {
  const [metrics, setMetrics] = useState<OBDMetrics>({
    rpm: 800,
    speed: 0,
    engineLoad: 15,
    coolantTemp: 40,
    throttlePos: 0,
    fuelLevel: 85,
    intakeTemp: 25,
    maf: 12.5,
    timingAdvance: 12,
    voltage: 13.8,
  });

  const [gear, setGear] = useState(1);
  const [drivingMode, setDrivingMode] = useState(config.drivingMode || DEFAULT_CONFIG.drivingMode);

  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Driving mode parameters
  const drivingParams = {
    idle: { throttleRange: [5, 15], speedRange: [0, 10], rpmRange: [750, 1200] },
    city: { throttleRange: [10, 60], speedRange: [0, 80], rpmRange: [1000, 4000] },
    highway: { throttleRange: [20, 40], speedRange: [80, 120], rpmRange: [2000, 3500] },
    track: { throttleRange: [40, 100], speedRange: [60, 180], rpmRange: [3000, 8000] },
  };

  const simulateDrivingCycle = useCallback(() => {
    const params = drivingParams[drivingMode];
    const time = Date.now();
    
    // Base throttle oscillation (simulates driver input)
    const baseThrottle = Math.sin(time / 5000) * 20 + 40;
    
    // Add random variations for realism
    const throttleVariation = Math.sin(time / 1500) * 10;
    const randomVariation = (Math.random() - 0.5) * 15;
    
    // Calculate throttle position (clamped to mode range)
    let throttle = baseThrottle + throttleVariation + randomVariation;
    throttle = Math.max(params.throttleRange[0], Math.min(params.throttleRange[1], throttle));
    
    // Gear shifting logic based on RPM
    let currentGear = gear;
    const rpm = metrics.rpm;
    
    if (rpm > 4500 && currentGear < fullConfig.gearRatios.length) {
      currentGear++;
      setGear(currentGear);
    } else if (rpm < 1500 && currentGear > 1) {
      currentGear--;
      setGear(currentGear);
    }
    
    // Calculate target RPM based on throttle and gear
    const gearPenalty = (currentGear - 1) * 200;
    const targetRpm = params.rpmRange[0] + (throttle * 60) - gearPenalty;
    
    // Smooth interpolation for realistic needle movement
    const currentRpm = metrics.rpm + (targetRpm - metrics.rpm) * 0.15;
    
    // Calculate speed based on RPM and gear ratio
    const speed = (currentRpm * fullConfig.gearRatios[currentGear - 1]) / 120;
    
    // Engine temperature simulation (warms up to operating range)
    let temp = metrics.coolantTemp;
    if (temp < fullConfig.temperatureRange.max) {
      temp += (currentRpm > 2000 ? 0.08 : 0.02);
    } else if (currentRpm < 1500) {
      temp -= 0.03; // Cool down at idle
    }
    
    // Intake temperature (slightly cooler than coolant)
    const intakeTemp = temp - 15 + (Math.sin(time / 8000) * 5);
    
    // Mass Air Flow calculation (based on RPM and throttle)
    const maf = (currentRpm * throttle) / 6000;
    
    // Engine load correlates with throttle
    const engineLoad = throttle * 0.85;
    
    // Timing advance varies with RPM
    const timingAdvance = 10 + (currentRpm / 500) + (Math.sin(time / 3000) * 3);
    
    // Voltage fluctuates with electrical load
    const voltage = 13.8 + (Math.sin(time / 4000) * 0.5) + (throttle > 50 ? -0.3 : 0);
    
    // Fuel consumption simulation
    const fuelConsumptionRate = (currentRpm * throttle) / 500000;
    const fuelLevel = Math.max(0, metrics.fuelLevel - fuelConsumptionRate);

    setMetrics({
      rpm: Math.round(currentRpm),
      speed: Math.round(speed),
      engineLoad: Math.round(engineLoad),
      coolantTemp: Math.round(temp),
      throttlePos: Math.round(throttle),
      fuelLevel: Math.round(fuelLevel),
      intakeTemp: Math.round(intakeTemp),
      maf: parseFloat(maf.toFixed(2)),
      timingAdvance: parseFloat(timingAdvance.toFixed(1)),
      voltage: parseFloat(voltage.toFixed(2)),
    });
  }, [drivingMode, gear, metrics, fullConfig.gearRatios, fullConfig.temperatureRange.max]);

  useEffect(() => {
    if (!isMocking) return;

    const interval = setInterval(simulateDrivingCycle, fullConfig.updateInterval);
    
    return () => clearInterval(interval);
  }, [isMocking, simulateDrivingCycle, fullConfig.updateInterval]);

  // Change driving mode periodically for variety
  useEffect(() => {
    if (!isMocking) return;

    const modeInterval = setInterval(() => {
      const modes: Array<keyof typeof drivingParams> = ['idle', 'city', 'highway', 'track'];
      const currentIndex = modes.indexOf(drivingMode as keyof typeof drivingParams);
      const nextIndex = (currentIndex + 1) % modes.length;
      setDrivingMode(modes[nextIndex]);
    }, 30000); // Change mode every 30 seconds

    return () => clearInterval(modeInterval);
  }, [isMocking, drivingMode]);

  return { ...metrics, gear, drivingMode };
}

// Utility function to create realistic mock data for testing
export function generateMockOBDData(): OBDMetrics {
  const time = Date.now();
  
  return {
    rpm: 800 + Math.sin(time / 3000) * 2000,
    speed: 30 + Math.sin(time / 5000) * 40,
    engineLoad: 25 + Math.sin(time / 4000) * 30,
    coolantTemp: 75 + Math.sin(time / 8000) * 10,
    throttlePos: 30 + Math.sin(time / 3500) * 25,
    fuelLevel: 65 + Math.sin(time / 10000) * 10,
    intakeTemp: 40 + Math.sin(time / 7000) * 8,
    maf: 15 + Math.sin(time / 4500) * 8,
    timingAdvance: 12 + Math.sin(time / 6000) * 5,
    voltage: 13.5 + Math.sin(time / 9000) * 0.8,
  };
}