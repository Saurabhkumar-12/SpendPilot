import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from './Logo';

export function PublicHeader({ onNavigate, activeModal, setActiveModal }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (activeModal) {
      setActiveModal(null);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigate) {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'py-3.5 bg-[#FCFCF8]/95 backdrop-blur-xl border-b border-[#DDE5DF] shadow-sm' 
        : 'py-5 bg-transparent'
    }`}>
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 flex items-center justify-between">
        
        {/* Native Vector Logo (140-170px desktop, 120-140px mobile) */}
        <div 
          onClick={() => { setActiveModal(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="cursor-pointer flex items-center gap-2.5"
          aria-label="SpendPilot Home"
        >
          <Logo className="h-9" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-[#161A18]">
          <button 
            onClick={() => scrollToSection('features')} 
            className="hover:text-[#19B86A] transition-colors duration-200"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('how-it-works')} 
            className="hover:text-[#19B86A] transition-colors duration-200"
          >
            How It Works
          </button>
          <button 
            onClick={() => scrollToSection('group-expenses')} 
            className="hover:text-[#19B86A] transition-colors duration-200"
          >
            Groups
          </button>
          <button 
            onClick={() => scrollToSection('ai-insights')} 
            className="hover:text-[#19B86A] transition-colors duration-200"
          >
            Insights
          </button>
          <button 
            onClick={() => setActiveModal('about')} 
            className="hover:text-[#19B86A] transition-colors duration-200"
          >
            About
          </button>
          <button 
            onClick={() => setActiveModal('contact')} 
            className="hover:text-[#19B86A] transition-colors duration-200"
          >
            Contact
          </button>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <button 
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 text-sm font-extrabold text-[#092B20] hover:text-[#19B86A] transition-colors duration-200"
          >
            Log in
          </button>
          <button 
            onClick={() => onNavigate('register')}
            className="btn-emerald px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-xl bg-[#EEF9F2] text-[#092B20] border border-[#DDE5DF] transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[73px] bg-[#FCFCF8] border-b border-[#DDE5DF] p-6 shadow-2xl space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-3 font-bold text-base text-[#161A18]">
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-left py-2.5 border-b border-[#EEF9F2]"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="text-left py-2.5 border-b border-[#EEF9F2]"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('group-expenses')} 
              className="text-left py-2.5 border-b border-[#EEF9F2]"
            >
              Groups
            </button>
            <button 
              onClick={() => scrollToSection('ai-insights')} 
              className="text-left py-2.5 border-b border-[#EEF9F2]"
            >
              AI Insights
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setActiveModal('about'); }} 
              className="text-left py-2.5 border-b border-[#EEF9F2]"
            >
              About Us
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setActiveModal('contact'); }} 
              className="text-left py-2.5"
            >
              Contact Support
            </button>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={() => { setMobileMenuOpen(false); onNavigate('login'); }}
              className="w-full py-3 text-center font-bold text-[#092B20] bg-[#EEF9F2] rounded-xl border border-[#DDE5DF]"
            >
              Log in
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); onNavigate('register'); }}
              className="w-full btn-emerald py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
