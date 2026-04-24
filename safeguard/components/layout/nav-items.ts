import {
  LayoutDashboard,
  Siren,
  Users,
  MapIcon,
  Clock,
  Share2,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Renders the item in the primary-accent color (used for SOS). */
  accent?: boolean;
};

export const navItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sos", label: "SOS", icon: Siren, accent: true },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/checkin", label: "Check-in", icon: Clock },
  { href: "/tracking", label: "Tracking", icon: Share2 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** 5 items chosen for mobile bottom tab bar — SOS lives center. */
export const mobileBottomItems: readonly NavItem[] = [
  navItems[0], // Dashboard
  navItems[3], // Map
  navItems[1], // SOS (center)
  navItems[2], // Contacts
  navItems[7], // Settings
];
