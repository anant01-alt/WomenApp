import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './MobileNav.module.css';

const items = [
  { to: '/dashboard', icon: '⊞', label: 'Home' },
  { to: '/map', icon: '🗺', label: 'Map' },
  { to: '/sos', icon: '🆘', label: 'SOS', sos: true },
  { to: '/chat', icon: '💬', label: 'Chat' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function MobileNav() {
  return (
    <nav className={styles.mobileNav}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''} ${item.sos ? styles.sosItem : ''}`
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
