'use client';

import React, { useEffect, useRef } from 'react';
import { 
  Ticket, 
  Clock, 
  AlertOctagon, 
  Star,
  Activity
} from 'lucide-react';
import gsap from 'gsap';

interface Metric {
  totalTickets: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  slaBreaches: number;
  averageCsat: number;
}

interface DashboardTabProps {
  stats: {
    metrics: Metric;
    categories: Record<string, number>;
    recentLogs: any[];
    recentComplaints: any[];
  } | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardTab({ stats, loading, onRefresh }: DashboardTabProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && stats && containerRef.current) {
      // Clear previous animations if any
      gsap.killTweensOf(containerRef.current.querySelectorAll('.gsap-fade-in'));
      // Staggered entry animation
      gsap.fromTo(
        containerRef.current.querySelectorAll('.gsap-fade-in'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power1.out' }
      );
    }
  }, [loading, stats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { metrics, categories, recentLogs } = stats;

  const cardData = [
    { title: 'Total Tickets', value: metrics.totalTickets, icon: Ticket },
    { title: 'Open Tickets', value: metrics.open, icon: Clock },
    { title: 'SLA Breaches', value: metrics.slaBreaches, icon: AlertOctagon },
    { title: 'Average CSAT', value: `${metrics.averageCsat}/5`, icon: Star },
  ];

  return (
    <div ref={containerRef} className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center gsap-fade-in">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground text-xs mt-1">Real-time analytical health of the support system</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:opacity-90 rounded-lg text-xs font-bold text-primary-foreground transition-all cursor-pointer shadow-sm border-none"
        >
          <Activity className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="shadcn-panel p-6 relative flex justify-between items-start gsap-fade-in bg-card border-none"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{card.title}</span>
                <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{card.value}</h3>
              </div>
              <div className="text-muted-foreground opacity-80 mt-1">
                <Icon className="w-5 h-5 stroke-[1.5]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Layout: Category Stats & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <div className="shadcn-panel p-6 bg-card border-none flex flex-col justify-between gsap-fade-in">
          <div>
            <h3 className="text-sm font-extrabold text-foreground mb-1">Ticket Categories</h3>
            <p className="text-muted-foreground text-[10px] mb-5">Distribution across business departments</p>
            
            <div className="space-y-4">
              {Object.entries(categories).map(([cat, val]) => {
                const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1;
                const percentage = Math.round((val / total) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{cat}</span>
                      <span className="text-muted-foreground">{val} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border-none">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-4 flex justify-between text-[10px] text-muted-foreground font-bold">
            <span>SLA Target Breach Limit:</span>
            <span className="text-foreground">1.0%</span>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 shadcn-panel p-6 bg-card border-none flex flex-col justify-between gsap-fade-in">
          <div>
            <h3 className="text-sm font-extrabold text-foreground mb-1">Audit History</h3>
            <p className="text-muted-foreground text-[10px] mb-5">Chronological interaction tracking log</p>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
              {recentLogs.length === 0 ? (
                <div className="text-muted-foreground text-xs text-center py-10 font-semibold">No recent actions.</div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-3.5 items-start text-xs border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                        <span className="text-foreground uppercase tracking-wider text-[9px]">{log.action}</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-foreground leading-relaxed font-medium">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
