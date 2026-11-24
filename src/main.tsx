/**
 * Entry point.
 *   src/harness/  presenter harness (setup page, top bar, stepper, sidebar, guide, scenario)
 *   src/steps/    simulated SAP screens per process step (Fiori + SAP GUI), lazy-loaded
 *   src/components/fiori|gui  SAP UI building blocks used by the steps
 *   src/styles/harness | sap  matching stylesheets
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@ui5/webcomponents-react';
import './icons';
import { ScenarioRoute } from './harness/DemoLayout';
import { Setup } from './harness/Setup';
import { Admin } from './harness/admin/Admin';
import { CustomerLink, Portal } from './harness/Portal';
import { useProfile } from './profile';
import { useDemo } from './store';
import './styles/harness/index.css';
import './styles/sap/index.css';

function Root() {
  const configured = useDemo((s) => s.configured);
  const customer = useProfile((s) => !!s.active);
  return <Navigate to={customer ? '/portal' : configured ? '/step/launchpad' : '/setup'} replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/c/:token" element={<CustomerLink />} />
          <Route path="/step/:id" element={<ScenarioRoute scn="j45" />} />
          <Route path="/:scn/step/:id" element={<ScenarioRoute />} />
          <Route path="*" element={<Root />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
