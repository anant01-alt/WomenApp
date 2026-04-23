import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSOS } from '../../context/SOSContext';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/sos', icon: '🆘', label: 'SOS Emergency', highlight: true },
  { to: '/map', icon: '🗺', label: 'Live Map' },
  { to: '/chat', icon: '💬', label: 'Emergency Chat' },
  { to: '/contacts', icon: '👥', label: 'Contacts' },
  { to: '/history', icon: '📋', label: 'Incident History' },
  { to: '/profile', icon: '👤', label: 'My Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isEmergency } = useSOS();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>🛡️</div>
        <div>
          <div className={styles.logoName}>SafeGuard</div>
          <div className={styles.logoTagline}>Women Safety System</div>
        </div>
      </div>

      {/* Emergency indicator */}
      {isEmergency && (
        <div className={styles.emergencyBadge}>
          <span className={`pulse-dot`} style={{ background: '#ff4757' }} />
          EMERGENCY ACTIVE
        </div>
      )}

      {/* Nav */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''} ${item.highlight ? styles.highlight : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.highlight && isEmergency && (
              <span className={styles.activeDot} />
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>⚙️</span>
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div className={styles.userFooter}>
        <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name}</div>
          <div className={styles.userEmail}>{user?.email}</div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}
