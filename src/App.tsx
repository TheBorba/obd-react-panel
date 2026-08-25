import { useState } from 'react';
import './App.css';
import { useDashboardData } from '@/hooks/useDashboardData';
import { getPanel, DEFAULT_PANEL_ID } from '@/panels/registry';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { loadSavedThemeId, savePanelThemeId } from '@/utils/themeStorage';

function App() {
  const [activePanelId, setActivePanelId] = useState<string>(
    () => loadSavedThemeId() ?? DEFAULT_PANEL_ID
  );

  // Single shared data source rendered by whichever theme is active.
  const dashboard = useDashboardData();
  const panel = getPanel(activePanelId);
  const PanelComponent = panel.component;

  const handleThemeChange = (id: string) => {
    setActivePanelId(id);
    savePanelThemeId(id);
  };

  return (
    <div className="App">
      <ThemeSwitcher activePanelId={activePanelId} onChange={handleThemeChange} />
      <PanelComponent {...dashboard} />
    </div>
  );
}

export default App;