import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import styles from './Registro.module.css';

const Registro = () => {
  const { register } = useAuth(); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'TURISTA' 
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. NUEVA VALIDACIÓN: Expresión regular estricta para el correo electrónico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor, ingresa un correo válido con una extensión (ej: .com, .cl).");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("¡Ups! Las contraseñas no coinciden.");
      return;
    }

    const resultado = await register(
      formData.nombre,
      formData.email,
      formData.password,
      formData.rol 
    );

    if (resultado.success) {
      alert(`¡Cuenta creada con éxito! Ahora puedes iniciar sesión.`);
      navigate('/login');
    } else {
      setError(resultado.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.registerCard}>
        <h2>Crea tu cuenta</h2>
        <p>Únete a TourMatch como {formData.rol.toLowerCase()}.</p>

        {error && <div className={styles.errorMessage} style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nombre Completo</label>
            <input 
              type="text" name="nombre" placeholder="Juan Pérez" 
              value={formData.nombre} onChange={handleChange} required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Correo Electrónico</label>
            <input 
              type="email" name="email" placeholder="correo@ejemplo.com" 
              value={formData.email} onChange={handleChange} required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>¿Qué tipo de usuario eres?</label>
            <select 
              name="rol" 
              value={formData.rol} 
              onChange={handleChange} 
              className={styles.select}
            >
              <option value="TURISTA">Turista / Pasajero</option>
              <option value="CONDUCTOR">Conductor / Chofer</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input 
              type="password" name="password" placeholder="Min. 8 caracteres" 
              value={formData.password} onChange={handleChange} required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Confirmar Contraseña</label>
            <input 
              type="password" name="confirmPassword" placeholder="Repite tu contraseña" 
              value={formData.confirmPassword} onChange={handleChange} required 
            />
          </div>

          <button type="submit" className={styles.registerBtn}>
            Crear cuenta
          </button>
        </form>

        <div className={styles.footer}>
          <p>¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Registro;