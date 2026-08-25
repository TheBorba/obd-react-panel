import { useState } from 'react';
import { LayoutGrid, X } from 'lucide-react';
import type { PanelDefinition } from '@/panels/types';
import { getAvailablePanels, getPanel } from '@/panels/registry';

interface ThemeSwitcherProps {
  activePanelId: string;
  onChange: (id: string) => void;
}

/**
 * Floating theme/panel picker. Lists every discoverable panel from the
 * registry and switches the active theme on click.
 */
export function ThemeSwitcher({ activePanelId, onChange }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const panels: PanelDefinition[] = getAvailablePanels();
  const active = getPanel(activePanelId);

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/90 border border-slate-700 text-sm font-medium text-slate-100 shadow-lg backdrop-blur hover:border-slate-500 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <LayoutGrid className="w-4 h-4 text-cyan-400" />
        <span>{open ? 'Themes' : active?.name ?? 'Theme'}</span>
        {open ? <X className="w-4 h-4" /> : <span className="text-slate-500">▾</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur overflow-hidden">
          <div className="px-4 pt-3 pb-2 text-xs uppercase tracking-wider text-slate-500">
            Panel Themes
          </div>
          <ul className="max-h-80 overflow-y-auto p-2 space-y-1">
            {panels.map(panel => {
              const isActive = panel.id === activePanelId;
              return (
                <li key={panel.id}>
                  <button
                    type="button"
                    onClick={() => select(panel.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-cyan-500/15 border border-cyan-500/40'
                        : 'border border-transparent hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{panel.name}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{panel.description}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}