'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchComplaints } from '../lib/api';
import gsap from 'gsap';

export default function ComplaintsTab() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.compl-item'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power1.out' }
      );
    }
  }, [loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const complData = await fetchComplaints();
      setComplaints(complData);

      const polRes = await fetch('http://localhost:4000/sla/policies');
      const polData = await polRes.json();
      setPolicies(polData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComplaint = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          managerNotes: 'Resolved by administrative manager.'
        }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 font-sans text-foreground">
      {/* Header */}
      <div className="compl-item">
        <h2 className="text-xl font-bold tracking-tight text-foreground">SLA Policies & Grievances</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Monitor resolution deadlines compliance and customer formal complaints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: SLA Policies */}
        <div className="lg:col-span-1 shadcn-panel p-5 bg-card shadow-sm rounded-xl h-fit space-y-3.5 compl-item">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">SLA Thresholds</h3>
          
          <div className="space-y-2.5">
            {policies.map((p) => (
              <div key={p.id} className="p-3 bg-muted rounded-lg space-y-1.5 border-none">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {p.priority} Priority
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground block font-semibold">Response</span>
                    <span className="font-bold text-foreground">{p.responseTimeHours}h</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-semibold">Resolution</span>
                    <span className="font-bold text-foreground">{p.resolutionTimeHours}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Active Complaints */}
        <div className="lg:col-span-2 space-y-3 compl-item">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Escalated Inbound Complaints</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-4 w-4 border-b border-primary"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="shadcn-panel p-6 text-center text-muted-foreground text-xs rounded-xl bg-card shadow-sm flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-muted-foreground" />
              <span className="font-bold">Complaints database empty. SLA targets are fully satisfied.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {complaints.map((c) => (
                <div key={c.id} className="shadcn-panel p-4 bg-card shadow-sm rounded-xl space-y-3 compl-item">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Complaint ID: {c.id.slice(0, 8)}</span>
                      <h4 className="text-xs font-bold text-foreground mt-0.5">Reference Ticket: {c.ticket?.title}</h4>
                      <p className="text-[11px] text-foreground mt-2 bg-muted p-2.5 rounded italic font-medium">
                        "{c.reason}"
                      </p>
                    </div>

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border-none ${
                      c.status === 'RESOLVED' 
                        ? 'text-muted-foreground bg-secondary font-bold' 
                        : 'text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 font-bold animate-pulse'
                    }`}>
                      {c.status.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-3 border-t border-border">
                    <span className="text-muted-foreground font-bold">Escalated to: <span className="text-foreground">{c.escalatedTo || 'Manager'}</span></span>
                    
                    {c.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveComplaint(c.id)}
                        className="px-2.5 py-1.5 bg-primary hover:opacity-90 rounded text-[10px] font-bold text-primary-foreground border-none transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
