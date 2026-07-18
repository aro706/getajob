import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  UploadCloud, CheckCircle2, ChevronRight, FileText, 
  Building2, Sparkles, Loader2, AlertCircle, Check, RefreshCw, Map 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AspirantDashboard = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // App Config States
  const [mode, setMode] = useState('auto');
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Persistent State Data
  const [resumeId, setResumeId] = useState(localStorage.getItem('cached_resume_id') || null);
  const [hasCachedResume, setHasCachedResume] = useState(!!localStorage.getItem('cached_resume_id'));
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [matchedRoles, setMatchedRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Auto-fetch if cached resume is present and user triggers manual mode transitions
  useEffect(() => {
    if (hasCachedResume && resumeId && mode === 'manual' && step === 2 && matchedRoles.length === 0) {
      fetchRolesForCachedResume();
    }
  }, [mode, step, hasCachedResume, resumeId]);

  const fetchRolesForCachedResume = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const roleRes = await axios.post('http://localhost:5000/api/resumes/match-roles', { resumeId });
      setMatchedRoles(roleRes.data.data || []);
    } catch (err) {
      console.error("Failed fetching cached roles", err);
      setError("Could not load your cached profile details.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Explicitly clear the local storage cache to let the user update their resume
  const handleClearResumeCache = () => {
    localStorage.removeItem('cached_resume_id');
    setResumeId(null);
    setHasCachedResume(false);
    setFile(null);
    setStep(1);
    setMatchedRoles([]);
    setError('');
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') { setFile(droppedFile); setError(''); } 
      else { setError('Please upload a PDF document.'); }
    }
  };

  // FLOW 1: MANUAL OVERRIDE (Using uploaded file or Cache fallback)
  const handleManualUpload = async () => {
    if (hasCachedResume && resumeId) {
      setStep(2);
      return;
    }

    if (!file) return;
    setIsProcessing(true);
    setError('');
    
    const formData = new FormData();
    formData.append("resume", file);
    
    try {
      const res = await axios.post('http://localhost:5000/api/resumes/upload', formData);
      const rId = res.data.data.resumeId;
      
      localStorage.setItem('cached_resume_id', rId);
      setResumeId(rId);
      setHasCachedResume(true);
      setExtractedSkills(res.data.data.parsedResume.skills || []);
      
      const roleRes = await axios.post('http://localhost:5000/api/resumes/match-roles', { resumeId: rId });
      setMatchedRoles(roleRes.data.data || []);
      setStep(2);
    } catch (err) {
      setError("Failed to process resume document configuration framework.");
    } finally {
      setIsProcessing(false);
    }
  };

  // FLOW 2: AUTOPILOT (One-Click Instant Execution)
  const handleAutomatedPipeline = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      let targetResumeId = resumeId;

      // If no cache, upload file first
      if (!hasCachedResume) {
        if (!file) { setError("Please load a resume file first."); setIsProcessing(false); return; }
        const formData = new FormData();
        formData.append("resume", file);
        const uploadRes = await axios.post('http://localhost:5000/api/resumes/upload', formData);
        targetResumeId = uploadRes.data.data.resumeId;
        localStorage.setItem('cached_resume_id', targetResumeId);
        setResumeId(targetResumeId);
        setHasCachedResume(true);
      }

      console.log(`🚀 Processing workflow pipeline directly using profile reference: ${targetResumeId}`);
      const pipelineRes = await axios.post('http://localhost:5000/api/resumes/trigger-pipeline', { resumeId: targetResumeId });

      const pipelineData = {
        resumeId: targetResumeId,
        outreachResults: pipelineRes.data.data.outreachResults
      };

      navigate('/aspirant/results', { state: { pipelineData } });
    } catch (err) {
      console.error(err);
      setError("Pipeline execution failed. Please verify local Atlas Search connections.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectRole = async (roleTitle) => {
    setSelectedRole(roleTitle);
    setIsProcessing(true);
    try {
       const compRes = await axios.post('http://localhost:5000/api/resumes/discover-companies', { roleTitle });
       setCompanies(compRes.data.data || []);
       setStep(3);
    } catch (err) {
       setError("Failed to discover companies for this role.");
    } finally {
       setIsProcessing(false);
    }
  };

  const handleStartOutreach = async () => {
    if (selectedCompanies.length === 0) return;
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
           matchPercentage: matchedData ? matchedData.matchPercentage : '90%',
           totalFound: outRes.data.data.hrContacts.length,
           hrContacts: outRes.data.data.hrContacts
        }]
      };

      navigate('/aspirant/results', { state: { pipelineData } });
    } catch (err) {
      setError("Failed to generate outreach drafts.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-20 shadow-xs">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight cursor-pointer" onClick={() => navigate('/aspirant/dashboard')}>
          HireAI
        </h1>
        
        <div className="flex items-center gap-4">
          {/* Roadmap Action Link */}
          <button
            onClick={() => navigate('/aspirant/roadmap')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 bg-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Map size={13} />
            Career Roadmap
          </button>

          {hasCachedResume && (
            <button
              onClick={handleClearResumeCache}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 bg-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw size={13} />
              Update Resume
            </button>
          )}

          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 focus:outline-none p-1.5 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.name || 'Aspirant'}</p>
                <p className="text-xs text-slate-500 font-medium">Job Seeker</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-slate-200 z-30">
                <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl w-full mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1 flex flex-col justify-start">
        
        {/* Switch toggles */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200/80 p-1.5 rounded-xl inline-flex shadow-inner">
            <button onClick={() => { setMode('auto'); setStep(1); setError(''); }} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${mode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              <Sparkles size={16} /> Autopilot Mode
            </button>
            <button onClick={() => { setMode('manual'); setStep(hasCachedResume ? 2 : 1); setError(''); }} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${mode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              Manual Override
            </button>
          </div>
        </div>

        {mode === 'manual' && (
          <div className="mb-8 max-w-xl mx-auto w-full px-4">
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-0"></div>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 transition-all duration-300 -z-0 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-white border-2 transition-colors ${step >= s ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'border-slate-300 text-slate-400'}`}>
                    {step > s ? <Check size={14} /> : s}
                  </div>
                  <span className={`text-[11px] font-semibold mt-1.5 ${step >= s ? 'text-slate-800' : 'text-slate-400'}`}>
                    {s === 1 ? 'Upload' : s === 2 ? 'Select Role' : 'Target Companies'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 View: Only shown if no cached profile exists */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center">
            {hasCachedResume ? (
              <div className="py-6">
                <FileText size={48} className="mx-auto text-indigo-600 mb-3" />
                <h3 className="text-xl font-bold text-slate-900">Active Profile Detected</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Your resume is indexed in the system vector workspace cache. Ready to engage targeting.</p>
                <div className="mt-6 flex justify-center gap-4">
                  <button onClick={mode === 'auto' ? handleAutomatedPipeline : () => setStep(2)} disabled={isProcessing} className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-indigo-700 transition-all cursor-pointer flex items-center gap-2">
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Use Stored Profile"}
                  </button>
                </div>
              </div>
            ) : (
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => inputRef.current.click()} className={`border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer ${isDragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'}`}>
                <UploadCloud size={32} className="mx-auto text-indigo-600 mb-3" />
                <h2 className="text-xl font-bold text-slate-900">{file ? file.name : "Drag & Drop your PDF Resume"}</h2>
                <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                <button type="button" className="mt-4 bg-white border border-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs shadow-2xs">Browse Files</button>
              </div>
            )}
            
            {file && !hasCachedResume && (
              <div className="mt-6">
                <button onClick={mode === 'auto' ? handleAutomatedPipeline : handleManualUpload} disabled={isProcessing} className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mx-auto cursor-pointer">
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Process New Resume"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2 View: Vector matched layout feed */}
        {step === 2 && (
          <div>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Target Matches</h2>
                <p className="text-slate-500 text-sm mt-0.5">Calculated using stored profile embeddings vectors.</p>
              </div>
            </div>

            <div className="space-y-4">
              {matchedRoles.map((role, i) => (
                <div key={i} onClick={() => !isProcessing && handleSelectRole(role.title)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all flex items-center justify-between group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{role.title}</h3>
                      <p className="text-slate-500 text-xs mt-1 max-w-xl line-clamp-1">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">{role.matchPercentage}</span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Company selectors */}
        {step === 3 && (
          <div>
            <div className="mb-4">
              <button onClick={() => setStep(2)} className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2 inline-block cursor-pointer">&larr; Back to Roles</button>
              <h2 className="text-xl font-bold text-slate-900">Targeting: {selectedRole}</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {companies.map((c, i) => {
                  const isSelected = selectedCompanies.includes(c.title);
                  return (
                    <div key={i} onClick={() => isSelected ? setSelectedCompanies(prev => prev.filter(x => x !== c.title)) : setSelectedCompanies(prev => [...prev, c.title])} className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                      <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{c.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleStartOutreach} disabled={isProcessing || selectedCompanies.length === 0} className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer">
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Draft Outreach"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AspirantDashboard;