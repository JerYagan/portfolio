'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/entries', label: 'Entries' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/profile', label: 'Profile' },
];

export function AdminNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Admin navigation" className="admin-sidebar"><p className="admin-nav-label">Workspace</p>{navigation.map((item) => {
    const active = item.href === '/admin' ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <Link aria-current={active ? 'page' : undefined} href={item.href} key={item.href}>{item.label}</Link>;
  })}<Link className="admin-sidebar__public" href="/" target="_blank" rel="noreferrer">View public site ↗</Link></nav>;
}
