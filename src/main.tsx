import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/dist/Assets.js';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import { DemoLayout } from './components/DemoLayout';
import { Setup } from './pages/Setup';
import { useDemo } from './store';
import './styles/app.css';
import './styles/fiori.css';
import './styles/gui.css';
import './styles/print.css';

function Root() {
  const configured = useDemo((s) => s.configured);
  return <Navigate to={configured ? '/step/launchpad' : '/setup'} replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/step/:id" element={<DemoLayout />} />
          <Route path="*" element={<Root />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
