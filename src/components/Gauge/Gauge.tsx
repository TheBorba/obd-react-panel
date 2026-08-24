import { useEffect, useRef, memo } from 'react';
import { GaugeCanvas } from './GaugeCanvas';
import { GaugeConfig, GaugeType, GaugeColorsPartial } from './types';


export interface GaugeProps extends Partial<Omit<GaugeConfig, 'colors'>> {
  value: number;
  type?: GaugeType;
  width?: number;
  height?: number;
  className?: string;
  onRender?: (canvas: HTMLCanvasElement) => void;
  colors?: GaugeColorsPartial;
}

const DEFAULT_CONFIG: GaugeConfig = {
  minValue: 0,
  maxValue: 100,
  majorTicks: 5,
  minorTicks: 2,
  units: '',
  title: '',
  valueFormat: (value: number) => value.toString(),
  animationSpeed: 50, // ms for needle movement
  colors: {
    plate: '#222',
    majorTicks: '#f5f5f5',
    minorTicks: '#ddd',
    title: '#fff',
    units: '#888',
    numbers: '#f5f5f5',
    needle: {
      start: 'rgba(240, 128, 128, 1)',
      end: 'rgba(255, 160, 122, .9)',
    },
    valueBox: {
      background: 'rgba(0, 0, 0, 0.3)',
      text: '#fff',
    },
    zones: [
      { from: 0, to: 50, color: '#00ff00' },
      { from: 50, to: 80, color: '#ffff00' },
      { from: 80, to: 100, color: '#ff0000' },
    ],
  },
};

export const Gauge = memo(function Gauge({
  value,
  type = 'radial',
  width = 300,
  height = 300,
  className = '',
  onRender,
  ...configOverrides
}: GaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gaugeRef = useRef<GaugeCanvas | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastValueRef = useRef(value);
  const targetValueRef = useRef(value);

  // Merge default config with overrides
  const config: GaugeConfig = {
    ...DEFAULT_CONFIG,
    ...configOverrides,
    colors: {
      ...DEFAULT_CONFIG.colors,
      ...configOverrides.colors,
      needle: {
        ...DEFAULT_CONFIG.colors.needle,
        ...configOverrides.colors?.needle,
      },
      valueBox: {
        ...DEFAULT_CONFIG.colors.valueBox,
        ...configOverrides.colors?.valueBox,
      },
    },
  };

  // Initialize gauge
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create gauge instance
    gaugeRef.current = new GaugeCanvas(canvasRef.current, {
      ...config,
      type,
      width,
      height,
    });

    // Initial render
    gaugeRef.current.draw(value);

    // Notify parent
    if (onRender && canvasRef.current) {
      onRender(canvasRef.current);
    }

    return () => {
      gaugeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [type, width, height, config, onRender]);

  // Animate value changes
  useEffect(() => {
    targetValueRef.current = value;

    const animate = () => {
      if (!gaugeRef.current) return;

      const currentValue = lastValueRef.current;
      const targetValue = targetValueRef.current;
      
      // Smooth interpolation
      const diff = targetValue - currentValue;
      const speed = config.animationSpeed || 50;
      const step = diff * (16 / speed); // 16ms per frame at 60fps
      
      const newValue = Math.abs(diff) < 0.1 ? targetValue : currentValue + step;
      
      lastValueRef.current = newValue;
      gaugeRef.current.draw(newValue);

      // Continue animation if not at target
      if (Math.abs(newValue - targetValue) > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, config.animationSpeed]);

  return (
    <div className={`gauge-container ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
});

// Pre-configured gauge types for common metrics
export const RPMGauge = memo(function RPMGauge(props: Omit<GaugeProps, 'type' | 'config'>) {
  return (
    <Gauge
      type="radial"
      minValue={0}
      maxValue={8000}
      majorTicks={8}
      minorTicks={4}
      units="RPM"
      title="Engine Speed"
      valueFormat={(value) => Math.round(value).toString()}
      colors={{
        zones: [
          { from: 0, to: 3000, color: '#00ff00' },
          { from: 3000, to: 5000, color: '#ffff00' },
          { from: 5000, to: 8000, color: '#ff0000' },
        ],
      }}
      {...props}
    />
  );
});

export const SpeedGauge = memo(function SpeedGauge(props: Omit<GaugeProps, 'type' | 'config'>) {
  return (
    <Gauge
      type="radial"
      minValue={0}
      maxValue={240}
      majorTicks={6}
      minorTicks={2}
      units="km/h"
      title="Vehicle Speed"
      valueFormat={(value) => Math.round(value).toString()}
      colors={{
        zones: [
          { from: 0, to: 80, color: '#00ff00' },
          { from: 80, to: 120, color: '#ffff00' },
          { from: 120, to: 240, color: '#ff0000' },
        ],
      }}
      {...props}
    />
  );
});

export const TemperatureGauge = memo(function TemperatureGauge(props: Omit<GaugeProps, 'type' | 'config'>) {
  return (
    <Gauge
      type="radial"
      minValue={-40}
      maxValue={120}
      majorTicks={8}
      minorTicks={2}
      units="°C"
      title="Coolant Temp"
      valueFormat={(value) => Math.round(value).toString()}
      colors={{
        zones: [
          { from: -40, to: 0, color: '#00ffff' },
          { from: 0, to: 40, color: '#0000ff' },
          { from: 40, to: 80, color: '#00ff00' },
          { from: 80, to: 100, color: '#ffff00' },
          { from: 100, to: 120, color: '#ff0000' },
        ],
      }}
      {...props}
    />
  );
});

export const LinearGauge = memo(function LinearGauge(props: Omit<GaugeProps, 'type'>) {
  return <Gauge type="linear" {...props} />;
});