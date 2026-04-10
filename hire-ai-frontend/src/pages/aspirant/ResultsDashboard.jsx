import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ResultsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  
  // Modal States
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeDraftTab, setActiveDraftTab] = useState('professional');
  
  // Email Sending States
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('idle'); // idle, success, error

  useEffect(() => {
    if (location.state && location.state.pipelineData) {
      setData(location.state.pipelineData);
    } else {
      navigate('/aspirant/dashboard');
    }
  }, [location, navigate]);

  const handleSendEmail = async () => {
    if (!selectedContact) return;
    
    setIsSending(true);
    setSendStatus('idle');

    try {
      // We send the specific draft the user selected to your backend
      await axios.post('http://localhost:5000/api/outreach/send-draft', {
        email: selectedContact.email,
        subject: `Reaching out regarding opportunities at ${selectedContact.company}`,
        body: selectedContact.drafts[activeDraftTab]
      });

      setSendStatus('success');
      
      // Auto-close modal after 2 seconds on success
      setTimeout(() => {
        setSelectedContact(null);
        setSendStatus('idle');
      }, 2000);

    } catch (error) {
      console.error("Failed to send email:", error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const closeModal = () => {
    setSelectedContact(null);
    setSendStatus('idle');
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-dune-dark flex items-center justify-center text-dune-sand animate-pulse font-cinzel text-2xl tracking-widest">
        Fetching Matrix Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dune-dark text-dune-sand p-6 lg:p-12 font-montserrat">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-dune-stone pb-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-cinzel font-bold text-dune-sky uppercase tracking-wider mb-2">
            Extraction Complete
          </h1>
          <p className="text-dune-tan text-sm lg:text-base">
            God Mode pipeline successfully analyzed your profile and identified key decision-makers.
          </p>
        </div>
        <button 
          onClick={() => navigate('/aspirant/dashboard')}
          className="mt-6 md:mt-0 px-6 py-2 border border-dune-spice text-dune-spice rounded hover:bg-dune-spice hover:text-dune-dark transition-all duration-300 font-bold uppercase text-sm cursor-pointer"
        >
          New Analysis
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-dune-stone/50 backdrop-blur-sm border border-dune-tan/30 rounded-xl p-6 shadow-2xl">
            <h2 className="font-cinzel text-xl text-dune-sand mb-4 flex items-center gap-2 uppercase">
              <svg className="w-5 h-5 text-dune-spice" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Extracted Capabilities
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {data.parsedResume?.skills?.map((skill, idx) => (
                <span key={idx} className="bg-dune-dark text-dune-sky px-3 py-1 rounded-full text-xs font-semibold border border-dune-sky/20">
                  {skill}
                </span>
              ))}
            </div>

            <h2 className="font-cinzel text-xl text-dune-sand mb-4 flex items-center gap-2 uppercase mt-8">
              <svg className="w-5 h-5 text-dune-spice" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Verified Experience
            </h2>
            <div className="space-y-3">
              {data.parsedResume?.experience?.map((exp, idx) => (
                <div key={idx} className="bg-dune-dark/50 p-3 rounded-lg border border-dune-stone">
                  <p className="font-bold text-dune-sand">{exp.title}</p>
                  <p className="text-dune-tan text-sm">{exp.company}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
          <h2 className="font-cinzel text-3xl text-dune-sand uppercase tracking-widest mb-6">Match & Outreach Matrix</h2>
          
          {data.outreachResults?.map((roleResult, idx) => (
            <div key={idx} className="bg-dune-stone/40 border border-dune-tan/20 rounded-xl overflow-hidden shadow-lg">
              
              <div className="p-6 bg-dune-stone/80 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-dune-tan/20">
                <div>
                  <h3 className="text-2xl font-bold text-dune-sand">{roleResult.targetRole}</h3>
                  <p className="text-dune-tan text-sm mt-1">Contacts Acquired: {roleResult.totalFound}</p>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col items-end">
                  <span className="text-2xl font-cinzel font-bold text-dune-spice">{roleResult.matchPercentage}%</span>
                  <span className="text-xs text-dune-tan uppercase tracking-wider">Suitability Match</span>
                </div>
              </div>

              <div className="p-6">
                {(!roleResult.hrContacts || roleResult.hrContacts.length === 0) ? (
                  <p className="text-dune-tan/70 italic text-sm">No direct HR contacts secured for this vector.</p>
                ) : (
                  <div className="space-y-4">
                    {roleResult.hrContacts.map((contact, cIdx) => (
                      <div key={cIdx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-dune-dark/60 rounded-lg border border-dune-stone hover:border-dune-sky/50 transition-colors">
                        <div className="mb-4 sm:mb-0">
                          <p className="font-bold text-dune-sand text-lg">{contact.name}</p>
                          <p className="text-dune-sky text-sm">{contact.company}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-dune-tan">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {contact.email}
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedContact(contact)}
                          className="px-5 py-2 bg-dune-blue text-white text-sm font-bold rounded shadow-lg hover:bg-blue-600 transition-colors cursor-pointer uppercase tracking-wide"
                        >
                          View AI Drafts
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* MODAL */}
      {selectedContact && selectedContact.drafts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dune-stone border-2 border-dune-tan/50 w-full max-w-3xl rounded-xl shadow-[0_0_40px_rgba(26,117,187,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-dune-tan/20 flex justify-between items-center bg-dune-dark/50">
              <div>
                <h3 className="text-xl font-cinzel text-dune-sand font-bold uppercase tracking-wide">Generated Comms for {selectedContact.name}</h3>
                <p className="text-sm text-dune-sky mt-1">{selectedContact.company} • {selectedContact.email}</p>
              </div>
              <button onClick={closeModal} className="text-dune-tan hover:text-white transition-colors cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex space-x-1 bg-dune-dark p-1 rounded-lg mb-6">
                {Object.keys(selectedContact.drafts).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDraftTab(tab)}
                    disabled={isSending}
                    className={`flex-1 py-2 text-sm font-bold capitalize rounded-md transition-all ${
                      activeDraftTab === tab ? 'bg-dune-spice text-white shadow' : 'text-dune-tan hover:text-white hover:bg-dune-stone/50 cursor-pointer'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="bg-white/5 border border-dune-tan/30 rounded-lg p-6 font-mono text-sm text-dune-sand leading-relaxed whitespace-pre-wrap">
                {selectedContact.drafts[activeDraftTab]}
              </div>
            </div>

            <div className="p-6 border-t border-dune-tan/20 bg-dune-dark flex justify-end gap-4 items-center">
              
              {/* Status Messages */}
              {sendStatus === 'error' && <span className="text-red-400 text-sm font-bold mr-auto">Transmission Failed.</span>}
              {sendStatus === 'success' && <span className="text-green-400 text-sm font-bold mr-auto">Email successfully dispatched!</span>}

              <button 
                onClick={closeModal}
                disabled={isSending}
                className="px-6 py-2 text-dune-tan font-bold hover:text-white transition-colors cursor-pointer uppercase text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleSendEmail}
                disabled={isSending || sendStatus === 'success'}
                className="px-6 py-2 bg-dune-spice text-dune-dark font-bold rounded hover:bg-orange-600 transition-colors shadow-lg cursor-pointer flex items-center gap-2 uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <span className="animate-pulse">Transmitting...</span>
                ) : sendStatus === 'success' ? (
                  <span>Sent</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Send to {selectedContact.name.split(' ')[0]}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;