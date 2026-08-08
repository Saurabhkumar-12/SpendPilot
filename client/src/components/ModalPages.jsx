import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Send, CheckCircle, FileText, ArrowLeft, HelpCircle } from 'lucide-react';

export function ModalPages({ activeModal, onClose, onNavigate }) {
  const [submitted, setSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  if (!activeModal) return null;

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[#071C16]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-10 shadow-2xl relative text-[#161A18] dark:text-[#F7FFF9]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-[#EEF9F2] dark:bg-[#153D30] text-[#092B20] dark:text-[#2ED47A] hover:opacity-80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ABOUT MODAL */}
        {activeModal === 'about' && (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5E8] text-[#092B20] text-xs font-bold font-mono">
              OUR MISSION
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-[#092B20] dark:text-[#F7FFF9]">
              Empowering financial clarity for groups and individuals.
            </h2>
            <p className="text-base text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
              SpendPilot was created with a clear directive: eliminate the friction, anxiety, and math headaches behind shared group expenses and personal budgeting. Whether you are managing roommates, splitting a holiday trip, or planning long-term savings goals, SpendPilot brings smart automation to your financial decisions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337]">
                <div className="text-2xl font-extrabold font-display text-[#19B86A]">100%</div>
                <div className="text-xs font-bold text-[#53635B] dark:text-[#B8C9C0] mt-1">Transparency</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337]">
                <div className="text-2xl font-extrabold font-display text-[#19B86A]">Zero</div>
                <div className="text-xs font-bold text-[#53635B] dark:text-[#B8C9C0] mt-1">Hidden Math</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337]">
                <div className="text-2xl font-extrabold font-display text-[#19B86A]">AI-Powered</div>
                <div className="text-xs font-bold text-[#53635B] dark:text-[#B8C9C0] mt-1">Insights</div>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT MODAL */}
        {activeModal === 'contact' && (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5E8] text-[#092B20] text-xs font-bold font-mono">
              GET IN TOUCH
            </div>
            <h2 className="text-3xl font-extrabold font-display text-[#092B20] dark:text-[#F7FFF9]">
              We'd love to hear from you.
            </h2>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-[#EEF9F2] dark:bg-[#071C16] border border-[#19B86A]/30 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-[#19B86A] mx-auto" />
                <h4 className="font-bold text-lg text-[#092B20] dark:text-[#F7FFF9]">Message Sent Successfully!</h4>
                <p className="text-xs text-[#53635B] dark:text-[#B8C9C0]">Thank you for reaching out. Our support team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#B8C9C0] uppercase tracking-wider mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="ABC"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337] focus:outline-none focus:border-[#19B86A] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#B8C9C0] uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="abc@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337] focus:outline-none focus:border-[#19B86A] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#092B20] dark:text-[#B8C9C0] uppercase tracking-wider mb-2">Message</label>
                  <textarea
                    rows="4"
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7F6F0] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337] focus:outline-none focus:border-[#19B86A] text-xs font-semibold"
                  ></textarea>
                </div>
                <button type="submit" className="w-full btn-emerald py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* PRIVACY POLICY */}
        {activeModal === 'privacy' && (
          <div className="space-y-4 text-xs text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
            <h2 className="text-2xl font-extrabold font-display text-[#092B20] dark:text-[#F7FFF9]">Privacy Policy</h2>
            <p>Your privacy is paramount. SpendPilot encrypts all user transaction data with 256-bit SSL encryption. We never sell or license personal spending metrics to third-party ad networks.</p>
          </div>
        )}

        {/* TERMS OF SERVICE */}
        {activeModal === 'terms' && (
          <div className="space-y-4 text-xs text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
            <h2 className="text-2xl font-extrabold font-display text-[#092B20] dark:text-[#F7FFF9]">Terms of Service</h2>
            <p>By using SpendPilot, you agree to track personal and group debts responsibly. Group balances and settlements are computed automatically based on user-entered splits.</p>
          </div>
        )}

        {/* BLOG / RESOURCES MODAL */}
        {activeModal === 'blog' && (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5E8] text-[#092B20] text-xs font-bold font-mono">
              FINANCIAL GUIDES & ARTICLES
            </div>
            <h2 className="text-3xl font-extrabold font-display text-[#092B20] dark:text-[#F7FFF9]">
              SpendPilot Insights & Blog
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337]">
                <span className="text-[11px] font-bold text-[#19B86A]">GUIDE • 5 MIN READ</span>
                <h4 className="font-bold text-lg text-[#092B20] dark:text-[#F7FFF9] mt-1">How Minimum Debt Graph Simplifies Group Settlements</h4>
                <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] mt-1">Learn how graph reduction algorithms collapse 12 group payments into 2 optimized transfers.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#EEF9F2] dark:bg-[#092B20] border border-[#DDE5DF] dark:border-[#1A4337]">
                <span className="text-[11px] font-bold text-[#19B86A]">FINANCE • 4 MIN READ</span>
                <h4 className="font-bold text-lg text-[#092B20] dark:text-[#F7FFF9] mt-1">The 50/30/20 Rule Enhanced by AI Context</h4>
                <p className="text-xs text-[#53635B] dark:text-[#B8C9C0] mt-1">Automating category thresholds so you never accidentally overspend on dining out.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
