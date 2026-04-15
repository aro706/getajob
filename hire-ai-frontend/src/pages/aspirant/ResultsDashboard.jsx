import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, User, Mail, Send, Check } from 'lucide-react';

const ResultsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeDraftTab, setActiveDraftTab] = useState('professional');
  const [editableDraft, setEditableDraft] = useState('');
  
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (location.state && location.state.pipelineData) {
      setData(location.state.pipelineData);
      // Auto-select the first contact if available
      const contacts = location.state.pipelineData.outreachResults[0]?.hrContacts;
      if(contacts && contacts.length > 0) setSelectedContact(contacts[0]);
    } else {
      navigate('/aspirant/dashboard');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (selectedContact && selectedContact.drafts) {
      setEditableDraft(selectedContact.drafts[activeDraftTab] || '');
    }
  }, [selectedContact, activeDraftTab]);

  const handleSendEmail = async () => {
    if (!selectedContact) return;
    setIsSending(true);

    try {
      await axios.post('http://localhost:5000/api/outreach/send', {
        resumeId: data.resumeId,
        selectedDraftText: editableDraft,
        hrEmail: selectedContact.email,
        roleTitle: data.outreachResults[0]?.targetRole
      });

      const updatedData = { ...data };
      const contactIdx = updatedData.outreachResults[0].hrContacts.findIndex(c => c.email === selectedContact.email);
      updatedData.outreachResults[0].hrContacts[contactIdx].emailSent = true;
      setData(updatedData);

    } catch (error) {
      alert("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  if (!data) return <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-medium text-gray-500">Loading Workspace...</div>;

  const contacts = data.outreachResults[0]?.hrContacts || [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">HireAI</h1>
        <button onClick={() => navigate('/aspirant/dashboard')} className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Start New Search
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Left Column: Contact List */}
        <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[calc(100vh-120px)]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
             <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Contacts Found</h2>
             <p className="text-xs text-gray-500 mt-1">{data.outreachResults[0]?.targetRole}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {contacts.map((contact, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedContact(contact)}
                className={`w-full text-left p-4 transition-colors flex items-center gap-3 ${selectedContact?.email === contact.email ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
              >
                <div className="h-10 w-10 rounded-full bg-gray-200 flex flex-shrink-0 items-center justify-center text-gray-600">
                   <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                   <p className="text-xs text-gray-500 truncate">{contact.company}</p>
                </div>
                {contact.emailSent && <CheckCircle2 size={16} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Email Editor */}
        <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[calc(100vh-120px)] overflow-hidden">
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">{selectedContact.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Building2 size={16} className="text-gray-400" /> {selectedContact.company}</span>
                  <span className="flex items-center gap-1"><Mail size={16} className="text-gray-400" /> {selectedContact.email}</span>
                </div>
              </div>

              {/* Tone Tabs */}
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex gap-4">
                {Object.keys(selectedContact.drafts || {}).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDraftTab(tab)}
                    disabled={selectedContact.emailSent}
                    className={`text-sm font-medium capitalize pb-2 border-b-2 transition-colors ${
                      activeDraftTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Editor */}
              <div className="flex-1 p-6 flex flex-col bg-gray-50">
                <textarea
                  value={editableDraft}
                  onChange={(e) => setEditableDraft(e.target.value)}
                  disabled={selectedContact.emailSent}
                  className="flex-1 w-full bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="No draft available..."
                />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
                <p className="text-xs text-gray-500">Subject: Application for {data.outreachResults[0]?.targetRole}</p>
                <button 
                  onClick={handleSendEmail}
                  disabled={isSending || selectedContact.emailSent}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? "Sending..." : selectedContact.emailSent ? <><Check size={16}/> Sent Successfully</> : <><Send size={16}/> Send Email</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <Mail size={48} className="mb-4 text-gray-300" />
               <p>Select a contact to view and send drafts.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default ResultsDashboard;