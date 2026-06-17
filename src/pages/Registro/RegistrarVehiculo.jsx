import { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; 
import styles from './RegistrarVehiculo.module.css';

const RegistrarVehiculo = ({ onRegistroExitoso }) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [vehiculo, setVehiculo] = useState({
    patente: '',
    marca: '',
    modelo: '',
    capacidad: 4
  });

  const handleChange = (e) => {
    setVehiculo({ ...vehiculo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.token) {
      return setMensaje({ texto: "Sesión inválida o expirada. Por favor, autentíquese.", tipo: 'error' });
    }
    
    setSubmitting(true);
    setMensaje({ texto: '', tipo: '' });
    
    try {
      const response = await fetch("https://tourmatchterminar-1.onrender.com/api/vehiculos/registrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}` 
        },
        body: JSON.stringify(vehiculo)
      });

      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok) {
        setMensaje({ texto: "El vehículo ha sido registrado exitosamente en el sistema.", tipo: 'success' });
        setVehiculo({ patente: '', marca: '', modelo: '', capacidad: 4 });
        
        if (onRegistroExitoso) {
          await onRegistroExitoso();
        }
      } else {
        setMensaje({ texto: data.mensaje || "No se pudo completar el registro. Intente nuevamente.", tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: "Error de comunicación con el servidor. Por favor, verifique su conexión.", tipo: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>Registrar mi Vehículo</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>Patente</label>
        <input type="text" name="patente" value={vehiculo.patente} onChange={handleChange} required placeholder="ABCD-12" />
        
        <label>Marca</label>
        <input type="text" name="marca" value={vehiculo.marca} onChange={handleChange} required placeholder="Ej: Toyota" />

        <label>Modelo</label>
        <input type="text" name="modelo" value={vehiculo.modelo} onChange={handleChange} required placeholder="Ej: Hiace" />

        <label>Capacidad</label>
        <input type="number" name="capacidad" value={vehiculo.capacidad} onChange={handleChange} required min="1" />

        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? 'Procesando...' : 'Registrar Vehículo'}
        </button>
      </form>
      {mensaje.texto && <p className={mensaje.tipo === 'success' ? styles.success : styles.error}>{mensaje.texto}</p>}
    </div>
  );
};

export default RegistrarVehiculo;