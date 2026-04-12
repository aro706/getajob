import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Cpu, ChevronRight, Activity } from 'lucide-react';
import CommandPalette from '../../components/CommandPalette';

const AspirantDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('auto');
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  
  const [resumeId, setResumeId] = useState(null);
  const [matchedRoles, setMatchedRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [extractedInsights, setExtractedInsights] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const initiateAutomatedPipeline = async () => {
    if (!file) return;
    setStatus('processing');
    setLogs(["[SYSTEM] Initializing AI Copilot...", "Generating structural vector embeddings..."]);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const uploadRes = await axios.post('http://localhost:5000/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setExtractedInsights(uploadRes.data.data.parsedResume);
      setLogs(prev => [...prev, "Extracting dominant traits..."]);
      
      setTimeout(async () => {
        setLogs(prev => [...prev, "Cross-referencing Qdrant matrix..."]);
        const pipelineRes = await axios.post('http://localhost:5000/api/resumes/trigger-pipeline', {
          resumeId: uploadRes.data.data.resumeId
        });

        setStatus('complete');
        setTimeout(() => {
          navigate('/aspirant/results', { state: { pipelineData: pipelineRes.data.data } });
        }, 1500);
      }, 2000);
    } catch (error) {
      setLogs(prev => [...prev, "⚠️ [FATAL] Pipeline execution halted."]);
      setStatus('idle');
    }
  };

  const processManualUpload = async () => {
    if (!file) return;
    setStatus('processing');
    setLogs(["Mapping neural embeddings...", "Quantizing resume text..."]);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await axios.post('http://localhost:5000/api/resumes/upload', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const rId = res.data.data.resumeId;
      setResumeId(rId);
      setExtractedInsights(res.data.data.parsedResume);
      
      setLogs(prev => [...prev, "Calculating cosine similarities for optimal roles..."]);
      const roleRes = await axios.post('http://localhost:5000/api/resumes/match-roles', { resumeId: rId });
      
      setMatchedRoles(roleRes.data.data);
      setStatus('idle');
      setStep(2);
    } catch(e) {
      setStatus('idle');
    }
  };

  const selectRoleAndFetchCompanies = async (roleTitle) => {
    setSelectedRole(roleTitle);
    setStatus('processing');
    setLogs([`Deploying discovery agents for ${roleTitle}...`]);
    try {
       const compRes = await axios.post('http://localhost:5000/api/resumes/discover-companies', { roleTitle });
       setCompanies(compRes.data.data);
       setStatus('idle');
       setStep(3);
    } catch (e) {
       setStatus('idle');
    }
  };

  const executeManualOutreach = async () => {
    if(selectedCompanies.length === 0) return;
    setStatus('processing');
    setLogs(["Bypassing AI filters...", "Extracting HR decision-makers...", "Prompting LLM for contextual drafts..."]);
    try {
      const outRes = await axios.post('http://localhost:5000/api/resumes/process-manual-outreach', {
         resumeId,
         roleTitle: selectedRole,
         companies: selectedCompanies
      });
      
      const matchedData = matchedRoles.find(r => r.title === selectedRole);
      const matchPct = matchedData ? matchedData.matchPercentage : '100%';

      const pipelineData = {
        resumeId,
        parsedResume: extractedInsights,
        outreachResults: [{
           targetRole: selectedRole,
           matchPercentage: matchPct,
           totalFound: outRes.data.data.hrContacts.length,
           hrContacts: outRes.data.data.hrContacts
        }]
      };

      navigate('/aspirant/results', { state: { pipelineData } });
    } catch(e) {
       setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-blue-950 text-blue-50 p-8 font-sans overflow-hidden relative">
      <CommandPalette />
      
      <div className="absolute top-0 left-0 w-full h-[500px] bg-sky-500/10 blur-[120px] pointer-events-none rounded-full -translate-y-1/2"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-12 border-b border-blue-900 pb-6">
          <div className="flex items-center gap-3">
            <Cpu className="text-sky-400" size={28} />
            <h1 className="text-2xl font-bold tracking-tight">AI Copilot</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-blue-300 bg-blue-900 px-3 py-1 rounded-full border border-blue-800">CMD + K</span>
            <button onClick={logout} className="text-blue-300 hover:text-blue-100 transition-colors text-sm font-medium">
              Disconnect
            </button>
          </div>
        </header>

        <div className="flex justify-center mb-10">
          <div className="bg-blue-900/50 backdrop-blur-md border border-blue-800 rounded-lg p-1 flex">
            <button 
              onClick={() => { setMode('auto'); setStep(1); setStatus('idle'); }} 
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${mode === 'auto' ? 'bg-sky-500/20 text-sky-400 shadow-sm' : 'text-blue-300 hover:text-blue-100'}`}
            >
              Autopilot
            </button>
            <button 
              onClick={() => { setMode('manual'); setStep(1); setStatus('idle'); }} 
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-sky-500/20 text-sky-400 shadow-sm' : 'text-blue-300 hover:text-blue-100'}`}
            >
              Manual Override
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && status === 'idle' && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center">
              <div 
                className={`w-full max-w-2xl p-16 border-2 border-dashed rounded-2xl text-center transition-all duration-300 bg-blue-900/30 backdrop-blur-sm ${dragActive ? 'border-sky-500 bg-sky-500/5' : 'border-blue-700 hover:border-blue-500'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                
                <UploadCloud className="mx-auto h-12 w-12 text-sky-400 mb-6" />
                <h3 className="text-xl font-semibold mb-2">{file ? file.name : "Inject Resume Protocol"}</h3>
                <p className="text-blue-300 mb-8 text-sm font-mono">Accepts strictly .pdf format.</p>
                
                <div className="flex justify-center gap-4">
                  <button onClick={() => inputRef.current.click()} className="bg-blue-800 text-blue-50 border border-blue-700 px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Browse Files
                  </button>
                  {file && (
                    <button onClick={mode === 'auto' ? initiateAutomatedPipeline : processManualUpload} className="bg-sky-600 text-white px-6 py-2.5 rounded-lg hover:bg-sky-500 transition-all font-medium shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                      {mode === 'auto' ? 'Engage Copilot' : 'Analyze Vectors'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && status === 'idle' && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-blue-50 mb-2">Target Synchronization</h2>
                <p className="text-blue-300 text-sm">Select the optimal dimensional fit based on your parsed vector weights.</p>
              </div>
              <div className="grid gap-4">
                {matchedRoles.map((role, i) => (
                  <button key={i} onClick={() => selectRoleAndFetchCompanies(role.title)} className="group flex items-center justify-between bg-blue-900/50 border border-blue-800 hover:border-sky-500/50 p-5 rounded-xl transition-all text-left">
                     <div>
                       <p className="font-semibold text-lg text-blue-50 group-hover:text-sky-300 transition-colors">{role.title}</p>
                       <p className="text-blue-400 text-sm mt-1">{role.description.substring(0, 80)}...</p>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className="text-xl font-mono text-cyan-400">{role.matchPercentage}</span>
                       <span className="text-[10px] uppercase tracking-wider text-blue-400">Compatibility</span>
                     </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && status === 'idle' && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-blue-50 mb-2">Verified Nodes for: <span className="text-sky-400">{selectedRole}</span></h2>
                  <p className="text-blue-300 text-sm">Select the organizational structures to infiltrate.</p>
                </div>
                <span className="font-mono text-sm text-blue-400">{selectedCompanies.length} selected</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {companies.map((c, i) => {
                   const isSelected = selectedCompanies.includes(c.title);
                   return (
                     <div key={i} onClick={() => {
                        if(isSelected) setSelectedCompanies(prev => prev.filter(x => x !== c.title));
                        else setSelectedCompanies(prev => [...prev, c.title]);
                     }} className={`cursor-pointer flex items-start gap-4 p-5 rounded-xl border transition-all ${isSelected ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'bg-blue-900/50 border-blue-800 hover:border-blue-600'}`}>
                        <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-blue-600'}`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-50">{c.title}</p>
                          <p className="text-xs text-blue-300 mt-2 leading-relaxed line-clamp-3">{c.snippet}</p>
                        </div>
                     </div>
                   )
                })}
              </div>
              <div className="flex justify-between mt-8 pt-6 border-t border-blue-800">
                <button onClick={() => setStep(2)} className="text-blue-300 hover:text-blue-100 px-4 py-2 text-sm font-medium transition-colors">
                   ← Back to Vectors
                </button>
                <button onClick={executeManualOutreach} disabled={selectedCompanies.length === 0} className="bg-sky-600 text-white px-8 py-2.5 rounded-lg hover:bg-sky-500 transition-all font-medium shadow-lg disabled:opacity-50 flex items-center gap-2">
                   Compile Comms <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto w-full">
              
              <div className="flex-1 bg-blue-900/50 border border-blue-800 rounded-xl p-6 h-[400px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent animate-[shimmer_2s_infinite]"></div>
                <div className="flex items-center gap-3 mb-6 border-b border-blue-800 pb-4">
                  <Activity className="text-sky-400 animate-pulse" size={20} />
                  <h3 className="font-mono text-sm tracking-widest text-blue-200 uppercase">Process Terminal</h3>
                </div>
                <div className="flex-1 font-mono text-sm text-blue-300 overflow-y-auto space-y-3 custom-scrollbar">
                  {logs.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={log.includes('WARNING') || log.includes('FATAL') ? 'text-rose-400' : 'text-blue-200'}>
                      <span className="text-blue-400 mr-2">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                      {log}
                    </motion.div>
                  ))}
                  <div className="w-2 h-4 bg-sky-400 animate-ping mt-2"></div>
                </div>
              </div>

              {extractedInsights && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full md:w-80 space-y-4">
                    <div className="bg-blue-900/80 backdrop-blur border border-blue-800 rounded-xl p-5">
                      <h4 className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-4">What the AI Sees</h4>
                      <div className="space-y-3">
                         <div>
                            <p className="text-[10px] text-blue-400 uppercase mb-1">Top Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {extractedInsights.skills?.slice(0, 6).map((s, i) => (
                                <span key={i} className="text-xs bg-blue-950 text-sky-300 px-2 py-0.5 rounded border border-blue-800">{s}</span>
                              ))}
                            </div>
                         </div>
                      </div>
                    </div>
                 </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AspirantDashboard;