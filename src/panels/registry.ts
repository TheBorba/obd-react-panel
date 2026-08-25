import type { PanelDefinition } from './types';
import { DefaultPanel } from './DefaultPanel';
import { BYDKingPanel } from './BYDKingPanel';

/**
 * Theme/panel register.
 *
 * Adding a new theme is two steps: create a `PanelDefinition` (metadata +
 * presentational component) and add it to `PANEL_REGISTRY` below. It then
 * becomes discoverable via `getAvailablePanels()` and switchable as an
 * interchangeable theme in the UI.
 */
export const PANEL_REGISTRY: Record<string, PanelDefinition> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Classic multi-gauge OBD-II dashboard with full PID control.',
    tagline: 'Web OBD-II Dashboard',
    component: DefaultPanel,
  },
  'byd-king': {
    id: 'byd-king',
    name: 'BYD King',
    description: 'BYD King main panel — a sleek automotive cockpit theme.',
    tagline: 'BYD King Main Panel',
    component: BYDKingPanel,
  },
};

/** Default theme id used on first load (before any user preference exists). */
export const DEFAULT_PANEL_ID = 'default';

/** All available (discoverable) themes. */
export function getAvailablePanels(): PanelDefinition[] {
  return Object.values(PANEL_REGISTRY);
}

/** Look up a single theme by id, falling back to the default. */
export function getPanel(id: string): PanelDefinition {
  return PANEL_REGISTRY[id] ?? PANEL_REGISTRY[DEFAULT_PANEL_ID];
}
