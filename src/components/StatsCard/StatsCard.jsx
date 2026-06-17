import styles from './StatsCard.module.css';

const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className={styles.card} style={{ borderTop: `4px solid ${color}` }}>
      <div 
        className={styles.iconContainer} 
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <h3 className={styles.value}>{value}</h3>
      </div>
    </div>
  );
};

export default StatsCard;