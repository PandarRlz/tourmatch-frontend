import styles from './Card.module.css';

// 🌟 AGREGADO: Ahora recibe la función "onDetailClick" desde el componente padre
const Card = ({ title, price, image, duration, onDetailClick }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={image} alt={title} />
        <span className={styles.price}>${price}</span>
      </div>
      <div className={styles.content}>
        <h3>{title}</h3>
        <p>⏱ Duración: {duration}</p>

        {/* 🌟 CORREGIDO: Al hacer clic, ejecuta la función del padre */}
        <button 
          className={styles.detailBtn} 
          onClick={onDetailClick}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default Card;