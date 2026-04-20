import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ExecPage from './pages/ExecPage'
import IoTPage from './pages/IoTPage'
import ProcurementPage from './pages/ProcurementPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/exec" replace />} />
        <Route path="/exec" element={<ExecPage />} />
        <Route path="/iot" element={<IoTPage />} />
        <Route path="/procurement" element={<ProcurementPage />} />
      </Routes>
    </Layout>
  )
}
