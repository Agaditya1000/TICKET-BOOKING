import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Booking } from './pages/Booking';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/booking/:id" element={<Booking />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
