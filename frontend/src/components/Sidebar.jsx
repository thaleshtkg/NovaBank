import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Users, Receipt, History,
  Landmark, FileText, User, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transfer', icon: ArrowLeftRight, label: 'Transfer Money' },
  { to: '/payees', icon: Users, label: 'Payees' },
  { to: '/transactions', icon: History, label: 'Transactions' },
  { to: '/bills', icon: Receipt, label: 'Bill Payments' },
  { to: '/fixed-deposits', icon: Landmark, label: 'Fixed Deposits' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-primary-950 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        data-testid="sidebar"
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-800">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">NovaBank</h1>
            <p className="text-xs text-primary-300">QA Testing Portal</p>
          </div>
        </div>

        <nav className="mt-4 px-3 space-y-1" data-testid="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`
              }
              data-testid={`nav-${to.slice(1)}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-primary-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-primary-200 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
