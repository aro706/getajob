import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Info, ExternalLink, X, Send } from 'lucide-react';
import CommandPalette from '../../components/CommandPalette';

const ResultsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeDraftTab, setActiveDraftTab] = useState('professional');
  const [editableDraft, setEditableDraft] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('idle');

  useEffect(() => {
    if (location.state && location.state.pipelineData) {
      setData(location.state.pipelineData);
    } else {
      navigate('/aspirant/dashboard');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (selectedContact && selectedContact.drafts) {
      setEditableDraft(selectedContact.drafts[activeDraftTab] || '');
    }
  }, [selectedContact, activeDraftTab]);

  const handleDraftEdit = (e) => {
    const newText = e.target.value;
    setEditableDraft(newText);
    const updatedContact = { ...selectedContact };
    updatedContact.drafts[activeDraftTab] = newText;
    setSelectedContact(updatedContact);
  };

  const handleSendEmail = async () => {
    if (!selectedContact) return;
    setIsSending(true);
    setSendStatus('idle');

    try {
      await axios.post('http://localhost:5000/api/outreach/send', {
        resumeId: data.resumeId,
        selectedDraftText: editableDraft,
        hrEmail: selectedContact.email,
        roleTitle: data.outreachResults[0]?.targetRole
      });

      setSendStatus('success');
      
      const updatedData = { ...data };
      const roleIdx = updatedData.outreachResults.findIndex(r => r.targetRole === data.outreachResults[0].targetRole);
      const contactIdx = updatedData.outreachResults[roleIdx].hrContacts.findIndex(c => c.email === selectedContact.email);
      updatedData.outreachResults[roleIdx].hrContacts[contactIdx].emailSent = true;
      setData(updatedData);

      setTimeout(() => {
        setSelectedContact(null);
        setSendStatus('idle');
      }, 1500);
    } catch (error) {
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  if (!data) return <div className="min-h-screen bg-blue-950 flex items-center justify-center text-sky-400 font-mono">Initializing Matrix...</div>;

  const calculateDashOffset = (pctString) => {
    const pct = parseFloat(pctString);
    const circumference = 2 * Math.PI * 40; 
    return circumference - (pct / 100) * circumference;
  };

  return (
    <div className="min-h-screen bg-blue-950 text-blue-50 p-6 lg:p-10 font-sans relative">
      <CommandPalette />
      
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-blue-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Outreach Matrix
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 uppercase">Live</span>
          </h1>
          <p className="text-blue-300 text-sm mt-1">Reviewing vector alignments and AI drafts.</p>
        </div>
        <button onClick={() => navigate('/aspirant/dashboard')} className="px-5 py-2 rounded-lg bg-blue-900 border border-blue-800 hover:bg-blue-800 text-blue-200 transition-all font-medium text-sm mt-4 md:mt-0 shadow-sm">
          New Analysis
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-blue-900/40 border border-blue-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
            </div>
            <h2 className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-4">Vector Fingerprint</h2>
            
            <div className="flex flex-wrap gap-1.5 mb-6">
              {data.parsedResume?.skills?.map((skill, idx) => (
                <span key={idx} className="bg-blue-950 text-sky-300 px-2.5 py-1 rounded-md text-[11px] font-medium border border-blue-800">
                  {skill}
                </span>
              ))}
            </div>

            <h2 className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-4 border-t border-blue-800 pt-4">Extracted History</h2>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-blue-800 before:to-transparent">
              {data.parsedResume?.experience?.map((exp, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-500 ring-4 ring-blue-950 relative z-10 shrink-0"></div>
                  <div>
                    <p className="font-medium text-blue-100 text-sm leading-tight">{exp.title}</p>
                    <p className="text-blue-300 text-xs mt-0.5">{exp.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-6">
          {data.outreachResults?.map((roleResult, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-blue-900/60 border border-blue-800 rounded-xl overflow-hidden shadow-sm backdrop-blur-sm">
              
              <div className="p-6 flex flex-col md:flex-row justify-between items-center bg-blue-900/80 border-b border-blue-800">
                <div className="w-full md:w-auto">
                  <h3 className="text-xl font-bold text-white mb-1">{roleResult.targetRole}</h3>
                  <div className="flex items-center gap-4 text-xs font-mono text-blue-300">
                    <span className="flex items-center gap-1"><Users size={14} /> {roleResult.totalFound} Targets</span>
                    <div className="group relative cursor-help flex items-center gap-1 text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                       <Info size={14} /> Explainability
                       <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-blue-800 text-blue-100 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 border border-blue-700">
                         Cosine similarity between your resume embeddings and standard descriptions for '{roleResult.targetRole}' indicates high overlap in core technical competencies.
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center gap-4 bg-blue-950 p-3 rounded-xl border border-blue-800">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-blue-800" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175.92" strokeDashoffset={calculateDashOffset(roleResult.matchPercentage)} strokeLinecap="round" className="text-cyan-400" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-blue-50">
                      {Math.round(parseFloat(roleResult.matchPercentage))}
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-medium text-blue-200">Match Score</p>
                     <p className="text-[10px] text-blue-400 uppercase tracking-widest">Qdrant Vector</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {(!roleResult.hrContacts || roleResult.hrContacts.length === 0) ? (
                  <div className="text-center py-8 text-blue-400 text-sm border border-dashed border-blue-800 rounded-lg">No direct HR entities identified for this node.</div>
                ) : (
                  <div className="grid gap-4">
                    {roleResult.hrContacts.map((contact, cIdx) => (
                      <div key={cIdx} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-blue-950 border border-blue-800 hover:border-sky-500/30 transition-all group rounded-xl">
                        
                        <div className="flex-1 w-full flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-blue-300 font-mono text-lg shrink-0">
                             {contact.name.charAt(0)}
                           </div>
                           <div>
                             <p className="font-medium text-blue-100 text-base">{contact.name}</p>
                             <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                               <span className="text-sky-400 text-xs font-medium">{contact.company}</span>
                               <span className="text-blue-400 text-xs flex items-center gap-1"><Mail size={12}/> {contact.email}</span>
                             </div>
                           </div>
                        </div>

                        {/* Timeline Status */}
                        <div className="hidden lg:flex items-center gap-2 mx-8 shrink-0">
                           <div className="flex flex-col items-center">
                             <CheckCircle2 size={16} className="text-emerald-500 mb-1" />
                             <span className="text-[9px] text-blue-400 uppercase font-mono">Found</span>
                           </div>
                           <div className="w-8 h-px bg-blue-800"></div>
                           <div className="flex flex-col items-center">
                             <CheckCircle2 size={16} className="text-emerald-500 mb-1" />
                             <span className="text-[9px] text-blue-400 uppercase font-mono">Drafted</span>
                           </div>
                           <div className="w-8 h-px bg-blue-800"></div>
                           <div className="flex flex-col items-center">
                             {contact.emailSent ? <CheckCircle2 size={16} className="text-emerald-500 mb-1" /> : <Circle size={16} className="text-blue-700 mb-1" />}
                             <span className={`text-[9px] uppercase font-mono ${contact.emailSent ? 'text-emerald-500' : 'text-blue-400'}`}>Sent</span>
                           </div>
                        </div>

                        <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                          <button 
                            onClick={() => setSelectedContact(contact)}
                            className={`w-full sm:w-auto px-5 py-2 text-sm font-medium rounded-lg transition-all ${contact.emailSent ? 'bg-blue-900 text-blue-300 border border-blue-800' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.2)]'}`}
                          >
                            {contact.emailSent ? 'Review Details' : 'Deploy Payload'}
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </section>
      </main>

      <AnimatePresence>
        {selectedContact && selectedContact.drafts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-blue-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-blue-900 border border-blue-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
              
              <div className="p-5 border-b border-blue-800 flex justify-between items-center bg-blue-950/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-mono text-xl">
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg text-blue-50 font-medium">Communication Configuration</h3>
                    <div className="flex items-center gap-2 text-sm text-blue-300 font-mono">
                      <span>{selectedContact.name}</span> <span className="text-blue-700">|</span> <span className="text-sky-300">{selectedContact.company}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedContact(null)} className="p-2 text-blue-400 hover:text-blue-100 bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors border border-transparent hover:border-blue-700">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-blue-950">
                <div className="w-full md:w-56 bg-blue-950 border-r border-blue-800 p-4 shrink-0 flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-mono mb-2 px-2">AI Variations</p>
                  {Object.keys(selectedContact.drafts).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveDraftTab(tab)}
                      disabled={isSending || selectedContact.emailSent}
                      className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                        activeDraftTab === tab ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner' : 'text-blue-300 hover:bg-blue-900 hover:text-blue-100 border border-transparent'
                      }`}
                    >
                      {tab} Pattern
                    </button>
                  ))}
                  
                  <div className="mt-auto p-3 bg-blue-900 rounded-lg border border-blue-800">
                     <p className="text-xs text-blue-300 mb-1"><span className="text-emerald-400">●</span> Verification</p>
                     <p className="text-xs font-mono text-blue-400 truncate">{selectedContact.email}</p>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col relative">
                  <textarea
                    value={editableDraft}
                    onChange={handleDraftEdit}
                    disabled={isSending || selectedContact.emailSent}
                    className="w-full h-full bg-blue-900/50 border border-blue-800 rounded-xl p-6 font-mono text-sm text-blue-200 leading-relaxed outline-none focus:border-sky-500/50 transition-colors resize-none disabled:opacity-60 custom-scrollbar shadow-inner"
                    placeholder="Generative output unavailable..."
                  />
                  {selectedContact.emailSent && (
                    <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center">
                       <div className="bg-blue-900 border border-blue-700 px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl">
                          <CheckCircle2 className="text-emerald-500" />
                          <span className="font-medium text-blue-100">Payload successfully delivered.</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-t border-blue-800 bg-blue-950 flex justify-between items-center shrink-0">
                
                <div className="font-mono text-xs text-blue-400">
                  {sendStatus === 'error' && <span className="text-rose-400 bg-rose-500/10 px-3 py-1 rounded">Transmission Failed. Check SMTP routing.</span>}
                  {sendStatus === 'success' && <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded">Delivery confirmed.</span>}
                  {sendStatus === 'idle' && <span>Ready to deploy</span>}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedContact(null)}
                    className="px-6 py-2.5 text-blue-300 font-medium hover:text-blue-100 transition-colors text-sm"
                  >
                    Abort
                  </button>
                  
                  <button 
                    onClick={handleSendEmail}
                    disabled={isSending || sendStatus === 'success' || selectedContact.emailSent}
                    className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-500 transition-all shadow-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <span className="animate-pulse flex items-center gap-2"><Clock size={16}/> Compiling...</span>
                    ) : (selectedContact.emailSent || sendStatus === 'success') ? (
                      <span className="flex items-center gap-2"><CheckCircle2 size={16}/> Dispatched</span>
                    ) : (
                      <>
                        <Send size={16}/> Deploy to {selectedContact.name.split(' ')[0]}
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultsDashboard;