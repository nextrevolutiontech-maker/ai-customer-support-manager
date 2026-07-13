'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  MessageSquare, 
  BookOpen, 
  AlertTriangle, 
  RefreshCw,
  Users,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, theme, toggleTheme }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', name: 'Tickets Queue', icon: Ticket },
    { id: 'chat', name: 'Live Chat Hub', icon: MessageSquare },
    { id: 'kb', name: 'Knowledge Base', icon: BookOpen },
    { id: 'complaints', name: 'Complaints & SLA', icon: AlertTriangle },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'simulation', name: 'Channel Simulator', icon: RefreshCw },
  ];

  return (
    <aside className="w-60 bg-card flex flex-col justify-between h-screen fixed left-0 top-0 z-20 font-sans transition-colors duration-150 shadow-sm">
      <div className="flex flex-col p-6">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center font-extrabold text-primary-foreground text-xs shadow-sm">
            N
          </div>
          <div>
            <h1 className="text-xs font-bold text-foreground tracking-wider uppercase">NRT SUPPORT</h1>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest block">AI Agent OS</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-100 border-none ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                } cursor-pointer`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 space-y-3">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-none transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-550" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                Dark Mode
              </>
            )}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground opacity-60">Toggle</span>
        </button>

        {/* User Block */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            AD
          </div>
          <div className="truncate">
            <h4 className="text-[11px] font-bold text-foreground truncate">System Admin</h4>
            <span className="text-[9px] text-muted-foreground truncate block">admin@nrt.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
