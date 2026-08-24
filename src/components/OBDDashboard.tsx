import { useState, useEffect } from 'react';
import { useOBDSimulator } from '@/hooks/useOBDSimulator';
import { useBluetoothOBD } from '@/hooks/useBluetoothOBD';
import { RPMGauge, SpeedGauge, TemperatureGauge, LinearGauge } from './Gauge/Gauge';
import { Car, Bluetooth, Wifi, Battery, Thermometer, Gauge as GaugeIcon, Fuel } from 'lucide-react';
import { OBDMetrics } from '@/types/obd';

export function OBDDashboard() {
  const [isMockMode, setIsMockMode] = useState(false);
  const [selectedPIDs, setSelectedPIDs] = useState<string[]>([
    '010C', // RPM
    '010D', // Speed
    '0104', // Engine Load
    '0105', // Coolant Temp
    '0111', // Throttle Position
    '012F', // Fuel Level
  ]);

  // Mock data simulator
  const mockData = useOBDSimulator(isMockMode, {
    drivingMode: 'city',
    maxRpm: 8000,
    updateInterval: 50,
  });

  // Real Bluetooth OBD data
  const {
    metrics: bluetoothData,
    connectionStatus,
    connectedDevice,
    error,
    isSupported,
    connect,
    disconnect,
  } = useBluetoothOBD({
    pidsToPoll: selectedPIDs,
    pollingInterval: 150,
  });

  // Use mock data when in mock mode, otherwise use Bluetooth data
  const activeData: OBDMetrics & { gear?: number; drivingMode?: string } = isMockMode 
    ? mockData 
    : bluetoothData;

  // Auto-switch to mock mode if Bluetooth is not supported
  useEffect(() => {
    if (!isSupported && !isMockMode) {
      setIsMockMode(true);
    }
  }, [isSupported, isMockMode]);

  // Handle mode toggle
  const handleModeToggle = () => {
    if (isMockMode) {
      // Switching from mock to real
      if (!isSupported) {
        alert('Web Bluetooth is not supported in this browser. Please use Chrome/Edge.');
        return;
      }
      setIsMockMode(false);
      connect();
    } else {
      // Switching from real to mock
      setIsMockMode(true);
      disconnect();
    }
  };

  // Handle PID selection
  const handlePIDToggle = (pid: string) => {
    setSelectedPIDs(prev => 
      prev.includes(pid) 
        ? prev.filter(p => p !== pid)
        : [...prev, pid]
    );
  };

  // Connection status display
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return `Connected to ${connectedDevice?.name || 'OBD Device'}`;
      case 'connecting': return 'Connecting...';
      case 'scanning': return 'Scanning for devices...';
      case 'initializing': return 'Initializing ELM327...';
      case 'error': return error || 'Connection error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Car className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold">Web OBD-II Dashboard</h1>
              <p className="text-gray-400">Real-time vehicle telemetry monitor</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
              <span className="text-sm font-medium">{getConnectionStatusText()}</span>
            </div>

            {/* Mode Toggle */}
            <button
              onClick={handleModeToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isMockMode
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isMockMode ? (
                <span className="flex items-center gap-2">
                  <Bluetooth className="w-4 h-4" />
                  Connect Bluetooth OBD-II
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Switch to Mock Mode
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isMockMode ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900 text-green-200'
          }`}>
            {isMockMode ? `Mock Mode: ${mockData.drivingMode}` : 'Live Bluetooth Mode'}
          </div>
          {isMockMode && mockData.gear && (
            <div className="px-3 py-1 bg-gray-800 rounded-full text-sm font-medium">
              Gear: {mockData.gear}
            </div>
          )}
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* RPM Gauge */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GaugeIcon className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold">Engine RPM</h2>
            </div>
            <span className="text-2xl font-bold text-red-400">{activeData.rpm}</span>
          </div>
          <RPMGauge value={activeData.rpm} width={300} height={200} />
        </div>

        {/* Speed Gauge */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">Vehicle Speed</h2>
            </div>
            <span className="text-2xl font-bold text-blue-400">{activeData.speed} km/h</span>
          </div>
          <SpeedGauge value={activeData.speed} width={300} height={200} />
        </div>

        {/* Temperature Gauge */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-semibold">Coolant Temperature</h2>
            </div>
            <span className="text-2xl font-bold text-orange-400">{activeData.coolantTemp}°C</span>
          </div>
          <TemperatureGauge value={activeData.coolantTemp} width={300} height={200} />
        </div>

        {/* Engine Load */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Engine Load</h2>
            <span className="text-2xl font-bold text-green-400">{activeData.engineLoad}%</span>
          </div>
          <LinearGauge 
            value={activeData.engineLoad}
            minValue={0}
            maxValue={100}
            units="%"
            title="Engine Load"
            width={300}
            height={150}
            colors={{
              zones: [
                { from: 0, to: 50, color: '#00ff00' },
                { from: 50, to: 80, color: '#ffff00' },
                { from: 80, to: 100, color: '#ff0000' },
              ],
            }}
          />
        </div>

        {/* Throttle Position */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Throttle Position</h2>
            <span className="text-2xl font-bold text-purple-400">{activeData.throttlePos}%</span>
          </div>
          <LinearGauge 
            value={activeData.throttlePos}
            minValue={0}
            maxValue={100}
            units="%"
            title="Throttle"
            width={300}
            height={150}
            colors={{
              zones: [
                { from: 0, to: 30, color: '#00ff00' },
                { from: 30, to: 70, color: '#ffff00' },
                { from: 70, to: 100, color: '#ff0000' },
              ],
            }}
          />
        </div>

        {/* Fuel Level */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">Fuel Level</h2>
            </div>
            <span className="text-2xl font-bold text-yellow-400">{activeData.fuelLevel}%</span>
          </div>
          <LinearGauge 
            value={activeData.fuelLevel}
            minValue={0}
            maxValue={100}
            units="%"
            title="Fuel"
            width={300}
            height={150}
            colors={{
              zones: [
                { from: 0, to: 20, color: '#ff0000' },
                { from: 20, to: 50, color: '#ffff00' },
                { from: 50, to: 100, color: '#00ff00' },
              ],
            }}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Voltage</span>
          </div>
          <div className="text-2xl font-bold">{activeData.voltage?.toFixed(1) || '13.8'}V</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Intake Temp</span>
          </div>
          <div className="text-2xl font-bold">{activeData.intakeTemp || '25'}°C</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GaugeIcon className="w-4 h-4 text-pink-400" />
            <span className="text-sm text-gray-400">MAF</span>
          </div>
          <div className="text-2xl font-bold">{activeData.maf?.toFixed(1) || '12.5'} g/s</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GaugeIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-400">Timing Advance</span>
          </div>
          <div className="text-2xl font-bold">{activeData.timingAdvance?.toFixed(1) || '12.0'}°</div>
        </div>
      </div>

      {/* PID Selection Panel */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Select PIDs to Monitor</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { pid: '010C', label: 'RPM', checked: selectedPIDs.includes('010C') },
            { pid: '010D', label: 'Speed', checked: selectedPIDs.includes('010D') },
            { pid: '0104', label: 'Engine Load', checked: selectedPIDs.includes('0104') },
            { pid: '0105', label: 'Coolant Temp', checked: selectedPIDs.includes('0105') },
            { pid: '0111', label: 'Throttle Pos', checked: selectedPIDs.includes('0111') },
            { pid: '012F', label: 'Fuel Level', checked: selectedPIDs.includes('012F') },
          ].map(({ pid, label, checked }) => (
            <label
              key={pid}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                checked ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handlePIDToggle(pid)}
                className="sr-only"
              />
              <span className="font-medium">{label}</span>
              <span className="text-sm text-gray-300">({pid})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-500 text-sm">
        <p>
          {isMockMode 
            ? 'Currently using simulated data. Connect a real ELM327 Bluetooth OBD-II adapter for live telemetry.'
            : 'Connected to real vehicle data via Web Bluetooth API.'
          }
        </p>
        <p className="mt-2">
          Compatible with Chrome/Edge browsers on desktop. Requires HTTPS or localhost.
        </p>
      </footer>
    </div>
  );
}