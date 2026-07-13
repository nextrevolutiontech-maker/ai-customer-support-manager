'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, User, Phone, Building, Clock } from 'lucide-react';
import gsap from 'gsap';

export default function CustomersTab() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDetails(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (!loading && Array.isArray(customers) && listRef.current) {
      gsap.fromTo(
        listRef.current.querySelectorAll('.cust-btn'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power1.out' }
      );
    }
  }, [loading, customers]);

  useEffect(() => {
    if (customerDetails && detailRef.current) {
      gsap.fromTo(
        detailRef.current.querySelectorAll('.timeline-log'),
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power1.out' }
      );
    }
  }, [customerDetails]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/customers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
        if (data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(data[0].id);
        }
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(`http://localhost:4000/customers/${id}`);
      const data = await res.json();
      setCustomerDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const safeCustomers = Array.isArray(customers) ? customers : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[84vh] overflow-hidden font-sans text-foreground">
      {/* Left panel: Customers List */}
      <div className="lg:col-span-1 shadcn-panel flex flex-col overflow-hidden h-full bg-card shadow-sm rounded-xl">
        <div className="p-3 bg-muted/40 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-xs font-bold text-foreground">Client Directory</h3>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-4 w-4 border-b border-primary"></div>
            </div>
          ) : safeCustomers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-xs font-semibold">No clients found.</div>
          ) : (
            safeCustomers.map((cust) => {
              const isSelected = selectedCustomerId === cust.id;
              return (
                <button
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`w-full text-left p-3.5 rounded-lg transition-all duration-100 border-none cust-btn cursor-pointer ${
                    isSelected 
                      ? 'bg-secondary text-secondary-foreground shadow-sm' 
                      : 'bg-transparent hover:bg-secondary/30'
                  }`}
                >
                  <h4 className="text-xs font-bold text-foreground">{cust.user?.name}</h4>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{cust.user?.email}</span>
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground mt-2 font-semibold">
                    <span>{cust.company || 'Private Client'}</span>
                    <span>{cust.tickets?.length || 0} tickets</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main panel: Customer details */}
      <div className="lg:col-span-3 shadcn-panel flex flex-col overflow-hidden h-full bg-card shadow-sm rounded-xl">
        {detailsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-primary"></div>
          </div>
        ) : customerDetails ? (
          <div ref={detailRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
            {/* Header profile info */}
            <div className="p-5 bg-muted/40 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-card flex items-center justify-center text-primary shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">{customerDetails.profile?.user?.name}</h3>
                  <span className="text-[10px] text-muted-foreground">{customerDetails.profile?.user?.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 font-semibold">
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{customerDetails.profile?.phoneNumber || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{customerDetails.profile?.company || 'No company'}</span>
                </div>
              </div>

              {customerDetails.profile?.notes && (
                <div className="bg-card p-3 rounded-lg shadow-sm text-[11px] text-foreground font-medium">
                  <span className="font-bold text-muted-foreground block mb-1 uppercase tracking-wider text-[9px]">Notes</span>
                  {customerDetails.profile.notes}
                </div>
              )}
            </div>

            {/* Interaction history timeline */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider">Interaction Logs</h4>
              
              <div className="space-y-3 pl-2.5 relative border-l border-secondary ml-1.5">
                {customerDetails.history?.length === 0 ? (
                  <div className="text-muted-foreground text-xs italic font-semibold">No interactions.</div>
                ) : (
                  customerDetails.history?.map((log: any) => (
                    <div key={log.id} className="relative pl-5 space-y-0.5 timeline-log">
                      <div className="absolute left-[-4px] top-1.5 w-1.5 h-1.5 rounded-full bg-primary border-none" />
                      <div className="flex justify-between items-center text-[9px] text-muted-foreground font-bold">
                        <span className="text-foreground uppercase tracking-widest">{log.action}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" /> {new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-foreground font-semibold">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Users className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-semibold">Select a customer profile to view history.</span>
          </div>
        )}
      </div>
    </div>
  );
}
