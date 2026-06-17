import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // CORRECCIÓN: Se cambió 'user.role' por 'user.rol' para sincronizar con el Backend
  const userRol = user.rol ? user.rol.toUpperCase() : null;

  if (allowedRoles && !allowedRoles.includes(userRol)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;