import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Componentes
import Navbar from './components/Navbar/Navbar';

// Páginas
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Registro from './pages/Registro/Registro';
import Panoramas from './pages/Panoramas/Panoramas';
import Nosotros from './pages/Nosotros/Nosotros';
import Contacto from './pages/Contacto/Contacto';

// Dashboards Separados
import DashboardTurista from './pages/Dashboard/DashboardTurista';
import DashboardConductor from './pages/Dashboard/DashboardConductor';
import DashboardAdmin from './pages/Dashboard/DashboardAdmin'; 

// --- EL INTERRUPTOR INTELIGENTE ---
const DashboardSwitcher = () => {
  const { user } = useAuth();
  
  console.log("Rol del usuario actual:", user?.rol);

  // Si el rol es ADMIN, renderiza el panel de control administrativo
  if (user?.rol === 'ADMIN') {
    return <DashboardAdmin />;
  }
  
  // Verificamos el rol que viene de Usuario.java (CONDUCTOR)
  if (user?.rol === 'CONDUCTOR') {
    return <DashboardConductor />;
  }
  
  return <DashboardTurista />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* RUTAS PÚBLICAS */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/panoramas" element={<Panoramas />} />
          {/* 🎯 CORREGIDO: Se eliminó por completo la línea de la ruta /lugares */}
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* RUTAS PROTEGIDAS */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['TURISTA', 'CONDUCTOR', 'ADMIN']}>
                <DashboardSwitcher />
              </ProtectedRoute>
            } 
          />

          {/* Ruta por defecto redirige a Home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;