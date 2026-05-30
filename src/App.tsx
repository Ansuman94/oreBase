import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout/AppLayout';
import { SearchPage } from './pages/SearchPage/SearchPage';
import { MineralsPage } from './pages/MineralsPage/MineralsPage';
import { ProcessesPage } from './pages/ProcessesPage/ProcessesPage';
import { SuppliersPage } from './pages/SuppliersPage/SuppliersPage';
import { PlannerPage } from './pages/PlannerPage/PlannerPage';
import { PredictorPage } from './pages/PredictorPage/PredictorPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/search" element={<AppLayout><SearchPage /></AppLayout>} />
        <Route path="/minerals" element={<AppLayout><MineralsPage /></AppLayout>} />
        <Route path="/processes" element={<AppLayout><ProcessesPage /></AppLayout>} />
        <Route path="/suppliers" element={<AppLayout><SuppliersPage /></AppLayout>} />
        <Route path="/planner" element={<AppLayout><PlannerPage /></AppLayout>} />
        <Route path="/predictor" element={<AppLayout><PredictorPage /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
