import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle2, ChevronRight, FileText, Building2 } from 'lucide-react';

const AspirantDashboard = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  // ADDED: The Mode Toggle State
  const [mode, setMode] = useState('auto');
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [resumeId, setResumeId] = useState(null);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [matchedRoles, setMatchedRoles] = useState([]);
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // ------------------------------------------------------------------
  // FLOW 1: MANUAL OVERRIDE (Step-by-Step)
  // ------------------------------------------------------------------
  const handleManualUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append("resume", file);
    
    try {
      const res = await axios.post('http://localhost:5000/api/resumes/upload', formData);
      const rId = res.data.data.resumeId;
      setResumeId(rId);
      setExtractedSkills(res.data.data.parsedResume.skills || []);
      
      const roleRes = await axios.post('http://localhost:5000/api/resumes/match-roles', { resumeId: rId });
      setMatchedRoles(roleRes.data.data);
      
      setStep(2);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to process resume.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ------------------------------------------------------------------
  // FLOW 2: AUTOPILOT (One-Click God Mode)
  // ------------------------------------------------------------------
  const handleAutomatedPipeline = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append("resume", file);
    
    try {
      // 1. Upload & Parse
      const uploadRes = await axios.post('http://localhost:5000/api/resumes/upload', formData);
      const rId = uploadRes.data.data.resumeId;
      const parsedData = uploadRes.data.data.parsedResume;

      // 2. Trigger the Heavy Outreach Pipeline
      const pipelineRes = await axios.post('http://localhost:5000/api/resumes/trigger-pipeline', { resumeId: rId });

      // 3. Combine the data and go directly to Results
      const pipelineData = {
        resumeId: rId,
        parsedResume: parsedData,
        outreachResults: pipelineRes.data.data.outreachResults
      };

      navigate('/aspirant/results', { state: { pipelineData } });
    } catch (error) {
      console.error("Automated pipeline failed", error);
      alert("Pipeline execution failed. Please check backend logs.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Step 2 Actions (Manual Flow) ---
  const handleSelectRole = async (roleTitle) => {
    setSelectedRole(roleTitle);
    setIsProcessing(true);
    try {
       const compRes = await axios.post('http://localhost:5000/api/resumes/discover-companies', { roleTitle });
       setCompanies(compRes.data.data);
       setStep(3);
    } catch (error) {
       console.error("Discovery failed", error);
    } finally {
       setIsProcessing(false);
    }
  };

  // --- Step 3 Actions (Manual Flow) ---
  const handleStartOutreach = async () => {
    if(selectedCompanies.length === 0) return;
    setIsProcessing(true);
    try {
      const outRes = await axios.post('http://localhost:5000/api/resumes/process-manual-outreach', {
         resumeId,
         roleTitle: selectedRole,
         companies: selectedCompanies
      });
      
      const matchedData = matchedRoles.find(r => r.title === selectedRole);
      
      const pipelineData = {
        resumeId,
        outreachResults: [{
           targetRole: selectedRole,
           matchPercentage: matchedData ? matchedData.matchPercentage : '100%',
           totalFound: outRes.data.data.hrContacts.length,
           hrContacts: outRes.data.data.hrContacts
        }]
      };

      navigate('/aspirant/results', { state: { pipelineData } });
    } catch (error) {
      console.error("Outreach failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">HireAI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">Workspace</span>
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            US
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        
        {/* ADDED: The Mode Toggle Switch */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-200 p-1 rounded-lg inline-flex shadow-inner">
            <button 
              onClick={() => { setMode('auto'); setStep(1); }} 
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${mode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Autopilot
            </button>
            <button 
              onClick={() => { setMode('manual'); setStep(1); }} 
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Manual Override
            </button>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <UploadCloud size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your Resume</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {mode === 'auto' 
                ? "We'll completely automate your job search. Upload your resume and let AI find roles, source HR contacts, and draft emails instantly." 
                : "We'll extract your skills and match you with open roles. You choose exactly which companies to target."}
            </p>
            
            <input 
              ref={inputRef} type="file" accept=".pdf" className="hidden" 
              onChange={(e) => setFile(e.target.files[0])} 
            />
            
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={() => inputRef.current.click()} 
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                {file ? file.name : "Select PDF Document"}
              </button>
              
              {file && (
                <button 
                  onClick={mode === 'auto' ? handleAutomatedPipeline : handleManualUpload} 
                  disabled={isProcessing}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm disabled:opacity-50"
                >
                  {isProcessing ? "Processing (This may take a minute)..." : (mode === 'auto' ? "Engage Autopilot" : "Continue Manually")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Role Matches (Only for Manual Mode) */}
        {step === 2 && (
          <div>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended Roles</h2>
                <p className="text-gray-500 text-sm mt-1">Select a role to discover actively hiring companies.</p>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
                   {extractedSkills.length} Skills Extracted
                 </span>
              </div>
            </div>

            <div className="space-y-4">
              {matchedRoles.map((role, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-500 group-hover:text-indigo-600 transition-colors">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{role.title}</h3>
                      <p className="text-gray-500 text-sm mt-1 max-w-xl">{role.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{role.matchPercentage}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Match Score</p>
                    </div>
                    <button 
                      onClick={() => handleSelectRole(role.title)}
                      disabled={isProcessing}
                      className="text-gray-400 hover:text-indigo-600 p-2 transition-colors disabled:opacity-50"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Company Selection (Only for Manual Mode) */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <button onClick={() => setStep(2)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-4 inline-block">&larr; Back to roles</button>
              <h2 className="text-2xl font-bold text-gray-900">Targeting: {selectedRole}</h2>
              <p className="text-gray-500 text-sm mt-1">Select the companies you want our AI to draft outreach emails for.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {companies.map((c, i) => {
                  const isSelected = selectedCompanies.includes(c.title);
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                         if(isSelected) setSelectedCompanies(prev => prev.filter(x => x !== c.title));
                         else setSelectedCompanies(prev => [...prev, c.title]);
                      }} 
                      className={`p-5 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <div>
                        <h4 className="text-md font-bold text-gray-900 flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          {c.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">{c.snippet}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleStartOutreach} 
                disabled={isProcessing || selectedCompanies.length === 0} 
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isProcessing ? "Drafting Emails..." : "Draft Outreach"}
                {!isProcessing && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AspirantDashboard;