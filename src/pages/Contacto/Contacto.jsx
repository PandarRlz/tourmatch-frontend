import { useState } from 'react';
import styles from './Contacto.module.css';

const Contacto = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: 'soporte',
    mensaje: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos de contacto:", formData);
    alert(`¡Gracias ${formData.nombre}! Hemos recibido tu mensaje. Te contactaremos pronto.`);
    setFormData({ nombre: '', email: '', asunto: 'soporte', mensaje: '' });
  };

  return (
    <div className={styles.container}>
      {/* 1. SECCIÓN HERO */}
      <header className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <h1>Contáctanos</h1>
          <p className={styles.subtitle}>
            ¿Tienes dudas o te interesa formar parte de nuestra red? Estamos aquí para ayudarte a moverte de forma inteligente.
          </p>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL: LAYOUT DE DOS COLUMNAS */}
      <div className={styles.content}>
        
        {/* Columna Izquierda: Información Corporativa */}
        <div className={styles.infoSection}>
          <div className={styles.textIntro}>
            <span className={styles.tagline}>ATENCIÓN AL CLIENTE</span>
            <h2>Canales Oficiales</h2>
            <p>Nuestro equipo operativo está disponible para resolver incidencias de viajes, convenios corporativos o resolver dudas sobre tu registro.</p>
          </div>

          <div className={styles.infoCardsGrid}>
            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>📍</div>
              <div>
                <h3>Ubicación Central</h3>
                <p>Av. Nueva Providencia 1881, Santiago, Chile.</p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>📞</div>
              <div>
                <h3>Teléfono de Contacto</h3>
                <p>+56 9 1234 5678</p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardIcon}>✉️</div>
              <div>
                <h3>Correo Electrónico</h3>
                <p className={styles.emailText}>soporte@tourmatch.cl</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario Premium */}
        <div className={styles.formSection}>
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>Envíanos un mensaje</h3>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  placeholder="Ej. Juan Pérez" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Asunto del Mensaje</label>
                <select 
                  value={formData.asunto}
                  onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                >
                  <option value="soporte">Soporte Técnico / Viajes</option>
                  <option value="conductor">Postulación para Conductor</option>
                  <option value="empresa">Convenios Corporativos</option>
                  <option value="otro">Otro Requerimiento</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Mensaje o Comentarios</label>
                <textarea 
                  rows="4" 
                  placeholder="Escribe de manera detallada tu solicitud aquí..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                  required
                ></textarea>
              </div>

              <button type="submit" className={styles.submitBtn}>Enviar Solicitud ✨</button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contacto;