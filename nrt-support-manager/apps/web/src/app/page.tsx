'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardTab from '../components/DashboardTab';
import TicketsTab from '../components/TicketsTab';
import ChatTab from '../components/ChatTab';
import KbTab from '../components/KbTab';
import ComplaintsTab from '../components/ComplaintsTab';
import CustomersTab from '../components/CustomersTab';
import SimulationTab from '../components/SimulationTab';
import CustomerWidget from '../components/CustomerWidget';
import { fetchStats } from '../lib/api';
import gsap from 'gsap';

export default function Home() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const mainRef = useRef<HTMLDivElement | null>(null);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
    loadStats();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // GSAP page fade-in on tab change
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.22, ease: 'power1.out' }
      );
    }
  }, [currentTab]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard statistics', e);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardTab stats={stats} loading={loading} onRefresh={loadStats} />;
      case 'tickets':
        return <TicketsTab agents={stats?.agents || []} onRefreshStats={loadStats} />;
      case 'chat':
        return <ChatTab tickets={stats?.recentComplaints?.map((c: any) => c.ticket) || []} onRefreshStats={loadStats} />;
      case 'kb':
        return <KbTab />;
      case 'complaints':
        return <ComplaintsTab />;
      case 'customers':
        return <CustomersTab />;
      case 'simulation':
        return <SimulationTab onRefreshStats={loadStats} />;
      default:
        return <DashboardTab stats={stats} loading={loading} onRefresh={loadStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans transition-colors duration-200">
      {/* Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />

      {/* Main Workspace */}
      <main ref={mainRef} className="flex-1 ml-60 p-8 relative z-10 max-w-7xl">
        {renderTabContent()}
      </main>

      {/* Simulated Public Customer Widget */}
      <CustomerWidget />
    </div>
  );
}
