import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* LOGO DE LA APP */}
        <Link to="/" className={styles.logo}>
          TourMatch <span className={styles.logoDot}>.</span>
        </Link>

        {/* MENÚ DE NAVEGACIÓN PRINCIPAL */}
        <ul className={styles.navMenu}>
          <li>
            <Link to="/" className={styles.navLink}>Inicio</Link>
          </li>
          <li>
            <Link to="/panoramas" className={styles.navLink}>Panoramas</Link>
          </li>
          {/* 🎯 "Lugares" ha sido removido exitosamente de esta lista */}
          <li>
            <Link to="/nosotros" className={styles.navLink}>Nosotros</Link>
          </li>
          <li>
            <Link to="/contacto" className={styles.navLink}>Contacto</Link>
          </li>
          
          {/* SI EL USUARIO ESTÁ LOGUEADO, MUESTRA SU DASHBOARD */}
          {user && (
            <li>
              <Link to="/dashboard" className={styles.dashboardLink}>
                Panel {user.rol === 'ADMIN' ? '🔐' : '👤'}
              </Link>
            </li>
          )}
        </ul>

        {/* BOTONES DE ACCIÓN (LOGIN / LOGOUT) */}
        <div className={styles.navActions}>
          {user ? (
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user.email}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.loginBtn}>Iniciar Sesión</Link>
              <Link to="/registro" className={styles.registerBtn}>Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;