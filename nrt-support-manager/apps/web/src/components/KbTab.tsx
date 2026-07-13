'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Plus, Eye } from 'lucide-react';
import { fetchKBArticles, searchKBArticles } from '../lib/api';
import gsap from 'gsap';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

// Custom React Dropdown Component (Fully styled, borderless, shadow-driven popover)
function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full text-xs font-semibold">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full shadcn-input text-xs p-2 rounded-lg bg-muted text-foreground flex justify-between items-center cursor-pointer border-none text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="text-[7px] opacity-60 ml-2">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-full bg-card shadow-lg rounded-lg py-1.5 z-50 border-none">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[10px] hover:bg-secondary/40 border-none bg-transparent cursor-pointer block ${
                opt.value === value ? 'bg-secondary text-foreground font-bold' : 'text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KbTab() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  
  // Drawer states
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    if (!loading && articles.length > 0 && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.kb-item'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power1.out' }
      );
    }
  }, [loading, articles]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await fetchKBArticles();
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await searchKBArticles(searchQuery);
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewArticle = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/knowledge/articles/${id}`);
      const data = await res.json();
      setSelectedArticle(data);
      loadArticles(); // Reload views count
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      setSaving(true);
      await fetch('http://localhost:4000/knowledge/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
        }),
      });

      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
      loadArticles();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = [
    { label: 'General', value: 'General' },
    { label: 'Billing', value: 'Billing' },
    { label: 'Technical', value: 'Technical' }
  ];

  return (
    <div ref={containerRef} className="space-y-6 font-sans text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center kb-item">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Knowledge Base</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Manage agent support documentation and self-service FAQs</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:opacity-90 rounded-lg text-xs font-semibold text-primary-foreground transition-all cursor-pointer border-none shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Article
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: Search & Articles List */}
        <div className="lg:col-span-2 space-y-3 kb-item">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search articles by title, categories or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full shadcn-input text-xs py-2.5 pl-8 pr-3 rounded-lg placeholder-muted-foreground"
              />
            </div>
            <button
              type="submit"
              className="px-4 bg-primary hover:opacity-90 rounded-lg text-xs font-bold text-primary-foreground transition-all cursor-pointer border-none shadow-sm"
            >
              Search
            </button>
          </form>

          {/* List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-4 w-4 border-b border-primary"></div>
              </div>
            ) : articles.length === 0 ? (
              <div className="shadcn-panel p-5 text-center text-muted-foreground text-xs rounded-xl bg-card shadow-sm">No articles found.</div>
            ) : (
              articles.map((art) => (
                <button
                  key={art.id}
                  onClick={() => handleViewArticle(art.id)}
                  className="w-full text-left shadcn-panel p-4 rounded-xl flex justify-between items-center hover:bg-secondary/40 transition-all duration-200 group kb-item cursor-pointer border-none bg-card shadow-sm"
                >
                  <div className="space-y-1.5 flex-1 pr-6">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-foreground bg-secondary px-2 py-0.5 rounded">
                      {art.category}
                    </span>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-black dark:group-hover:text-white transition-colors mt-1">{art.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{art.content}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-shrink-0 font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    {art.views} views
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Preview Article or Add Drawer */}
        <div className="lg:col-span-1 kb-item">
          {isAdding ? (
            <div className="shadcn-panel p-5 bg-card shadow-sm rounded-xl space-y-3.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">New Article</h3>
              
              <form onSubmit={handleAddArticle} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Password resets..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full shadcn-input text-xs py-2 px-3 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Category</label>
                  <CustomSelect
                    value={newCategory}
                    onChange={setNewCategory}
                    options={categoryOptions}
                  />
                </div>

                <div className="space-y-1 mt-2.5">
                  <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Body</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Write article details..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full shadcn-input text-xs p-2.5 rounded-lg resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end text-xs font-semibold pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 bg-secondary hover:opacity-90 rounded-lg text-foreground border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 bg-primary hover:opacity-90 rounded-lg text-primary-foreground disabled:opacity-50 cursor-pointer border-none"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          ) : selectedArticle ? (
            <div className="shadcn-panel p-5 bg-card shadow-sm rounded-xl space-y-3">
              <span className="text-[9px] uppercase font-bold tracking-wider text-foreground bg-secondary px-2 py-0.5 rounded">
                {selectedArticle.category}
              </span>
              <h3 className="text-xs font-bold text-foreground mt-1">{selectedArticle.title}</h3>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium">{selectedArticle.content}</p>
              
              <div className="border-t border-border pt-3 flex justify-between text-[9px] text-muted-foreground font-bold">
                <span>{selectedArticle.views} views</span>
                <span>Updated: {new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="shadcn-panel p-6 text-center text-muted-foreground text-xs rounded-xl bg-card shadow-sm flex flex-col items-center justify-center gap-2 h-full min-h-[220px]">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold">Select an article to preview.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
