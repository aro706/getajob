import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle2, User, Mail, Send, Check, Building2, 
  ChevronLeft, AlertCircle, Loader2, Sparkles, Menu, X, Briefcase 
} from 'lucide-react';

const ResultsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  
  // Multi-Role & Selection State
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeDraftTab, setActiveDraftTab] = useState('professional');
  const [editableDraft, setEditableDraft] = useState('');
  
  // UI Telemetry Flags
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.state && location.state.pipelineData) {
      setData(location.state.pipelineData);
      
      // Auto-select the first contact of the first role group matching the payload
      const initialContacts = location.state.pipelineData.outreachResults[0]?.hrContacts;
      if (initialContacts && initialContacts.length > 0) {
        setSelectedContact(initialContacts[0]);
      }
    } else {
      navigate('/aspirant/dashboard');
    }
  }, [location, navigate]);

  // Whenever the active role category changes, auto-select its top candidate contact
  useEffect(() => {
    if (data && data.outreachResults[activeRoleIndex]) {
      const roleContacts = data.outreachResults[activeRoleIndex].hrContacts || [];
      if (roleContacts.length > 0) {
        setSelectedContact(roleContacts[0]);
      } else {
        setSelectedContact(null);
      }
      setError('');
    }
  }, [activeRoleIndex, data]);

  // Sync draft workspace input window text changes with selected template tone adjustments
  useEffect(() => {
    if (selectedContact && selectedContact.drafts) {
      setEditableDraft(selectedContact.drafts[activeDraftTab] || '');
      setError('');
    }
  }, [selectedContact, activeDraftTab]);

  const handleSendEmail = async () => {
    if (!selectedContact || !data) return;
    setIsSending(true);
    setError('');

    const currentRoleTitle = data.outreachResults[activeRoleIndex]?.targetRole;

    try {
      await axios.post('http://localhost:5000/api/outreach/send', {
        resumeId: data.resumeId,
        selectedDraftText: editableDraft,
        hrEmail: selectedContact.email,
        roleTitle: currentRoleTitle
      });

      // Update local reactive state tracking to mark the contact as successfully dispatched
      const updatedData = { ...data };
      const contactIdx = updatedData.outreachResults[activeRoleIndex].hrContacts.findIndex(
        c => c.email === selectedContact.email
      );
      if (contactIdx !== -1) {
        updatedData.outreachResults[activeRoleIndex].hrContacts[contactIdx].emailSent = true;
      }
      setData(updatedData);
    } catch (err) {
      console.error("Email send tracking failure:", err);
      setError("Failed to dispatch email. Ensure your mail microservice transporter parameters are online.");
    } finally {
      setIsSending(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-500 gap-3 font-sans">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
      <span className="text-sm font-semibold">Configuring Outreach Workspaces...</span>
    </div>
  );

  const currentRoleGroup = data.outreachResults[activeRoleIndex] || {};
  const currentContacts = currentRoleGroup.hrContacts || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Top Navbar Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex justify-between items-center shrink-0 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            HireAI
          </span>
          <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
            Unified Autopilot Hub
          </span>
        </div>

        
      <button 
        onClick={() => navigate('/aspirant/dashboard')} 
        className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Briefcase size={16} />
        <span>View Pipeline Hub</span>
      </button>
      </header>

      {/* NEW INTERACTIVE BLOCK: Horizontal Role Selector Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 shrink-0 overflow-x-auto flex items-center gap-2 shadow-xs scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0">
          <Briefcase size={14} className="text-indigo-500" /> Derived AI Roles:
        </div>
        {data.outreachResults.map((result, idx) => (
          <button
            key={idx}
            onClick={() => setActiveRoleIndex(idx)}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
              activeRoleIndex === idx
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{result.targetRole}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
              activeRoleIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {result.matchPercentage}
            </span>
          </button>
        ))}
      </div>

      {/* Main Structural Layout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex gap-6 overflow-hidden relative min-h-0">
        
        {/* Left Column Feed Drawer: Sourced HR contacts for the ACTIVE role */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-20 w-80 lg:w-1/3 bg-white border-r lg:border border-slate-200 lg:rounded-2xl shadow-xl lg:shadow-sm flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0 top-[110px]' : '-translate-x-full lg:translate-x-0'}
          h-[calc(100vh-110px)] lg:h-full
        `}>
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Pipeline</h2>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate max-w-[210px]">
                {currentRoleGroup.targetRole || "Scanning Roles..."}
              </p>
            </div>
            <span className="text-xs bg-white border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-full">
              {currentContacts.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {currentContacts.map((contact, idx) => {
              const isSelected = selectedContact?.email === contact.email;
              return (
                <button 
                  key={idx} 
                  onClick={() => { setSelectedContact(contact); setIsSidebarOpen(false); }}
                  className={`w-full text-left p-4 transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex shrink-0 items-center justify-center font-bold text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                     {contact.name ? contact.name.charAt(0) : <User size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-slate-900 truncate">{contact.name}</p>
                     <p className="text-xs text-slate-500 truncate mt-0.5">{contact.company}</p>
                  </div>
                  {contact.emailSent && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 shadow-2xs" title="Dispatched" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column Workspace: AI Copywriting Engine */}
        <section className="w-full lg:w-2/3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden min-h-0">
          {selectedContact ? (
            <>
              {/* Dynamic Recruiter Identity Bar */}
              <div className="p-6 border-b border-slate-200 bg-white shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedContact.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium"><Building2 size={16} className="text-slate-400" /> {selectedContact.company}</span>
                      <span className="flex items-center gap-1.5 font-medium"><Mail size={16} className="text-slate-400" /> {selectedContact.email}</span>
                    </div>
                  </div>
                  {selectedContact.emailSent && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Check size={14} /> Dispatched
                    </span>
                  )}
                </div>
              </div>

              {/* AI Draft Tone Selector Grid */}
              <div className="px-6 border-b border-slate-200 bg-slate-50/60 flex items-center gap-6 overflow-x-auto shrink-0 scrollbar-none">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 py-3 uppercase tracking-wider shrink-0">
                  <Sparkles size={14} className="text-indigo-500" /> Pitch Direction:
                </div>
                {Object.keys(selectedContact.drafts || {}).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDraftTab(tab)}
                    disabled={selectedContact.emailSent}
                    className={`text-sm font-semibold capitalize py-3 border-b-2 transition-all shrink-0 cursor-pointer ${
                      activeDraftTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Error Metrics Warning Display */}
              {error && (
                <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs sm:text-sm shrink-0">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Text Writing Area */}
              <div className="flex-1 p-6 bg-slate-50/40 min-h-0 flex flex-col">
                <textarea
                  value={editableDraft}
                  onChange={(e) => setEditableDraft(e.target.value)}
                  disabled={selectedContact.emailSent}
                  className="w-full flex-1 bg-white border border-slate-200/80 rounded-xl p-5 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none disabled:bg-slate-100 disabled:text-slate-500 shadow-2xs font-sans"
                  placeholder="Drafting dynamic email contents..."
                />
              </div>

              {/* Footer Transaction Trigger Bar */}
              <div className="p-4 sm:px-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <p className="text-xs text-slate-500 font-medium truncate max-w-sm">
                  Applying For: <span className="text-slate-800 font-semibold">{currentRoleGroup.targetRole}</span>
                </p>
                <button 
                  onClick={handleSendEmail}
                  disabled={isSending || selectedContact.emailSent}
                  className="w-full sm:w-auto bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Transmitting SMTP...</span>
                    </>
                  ) : selectedContact.emailSent ? (
                    <>
                      <Check size={16} />
                      <span>Sent Successfully</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Personalized Email</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 shadow-inner">
                 <Mail size={32} className="text-slate-300" />
               </div>
               <p className="font-semibold text-slate-600">No Target Contact Identified</p>
               <p className="text-xs text-slate-400 mt-1 max-w-xs">
                 Select an active candidate role tab from the top navigation bar to unlock potential contact entries.
               </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ResultsDashboard;