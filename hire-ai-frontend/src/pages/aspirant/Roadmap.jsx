// hire-ai-frontend/src/pages/aspirant/Roadmap.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, UploadCloud, FileText, Sparkles, 
  Loader2, AlertCircle, Calendar, Briefcase, CheckCircle2,
  Clock, CheckSquare 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AspirantRoadmap = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { user } = useAuth();

  // App Config States
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Roadmap Request parameters
  const [targetRole, setTargetRole] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [roadmapResult, setRoadmapResult] = useState(null);

  // Read the global resume cache updated by the dashboard
  const [resumeId, setResumeId] = useState(localStorage.getItem('cached_resume_id') || null);
  const [hasCachedResume, setHasCachedResume] = useState(!!localStorage.getItem('cached_resume_id'));

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') { 
        setFile(droppedFile); 
        setError(''); 
      } else { 
        setError('Please upload a PDF document.'); 
      }
    }
  };

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      let currentResumeId = resumeId;

      // STEP 1: If user has never uploaded a resume, upload it first to save embeddings
      if (!hasCachedResume) {
        if (!file) {
          setError("Please select or drop a resume PDF file to parse your skill vector embeddings.");
          setIsProcessing(false);
          return;
        }

        const formData = new FormData();
        formData.append("resume", file);
        
        // Hits your existing resume processing pipeline
        const uploadRes = await axios.post('http://localhost:5000/api/resumes/upload', formData);
        currentResumeId = uploadRes.data.data.resumeId;
        
        // Globally update state and cache to prevent uploading next time
        localStorage.setItem('cached_resume_id', currentResumeId);
        setResumeId(currentResumeId);
        setHasCachedResume(true);
      }

      // STEP 2: Fire request to the roadmap generation engine
      const roadmapPayload = {
        resumeId: currentResumeId,
        goal: targetRole,
        availableTime: String(availableTime) // Ensure consistent data types
      };

      const response = await axios.post('http://localhost:5000/api/roadmap', roadmapPayload);
      setRoadmapResult(response.data.data);

    } catch (err) {
      console.error("Roadmap compilation failure:", err);
      setError(err.response?.data?.error || "Failed to process roadmap configuration framework.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/aspirant/dashboard')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight cursor-pointer" onClick={() => navigate('/aspirant/dashboard')}>
            HireAI Roadmap Engine
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1 flex flex-col justify-start">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!roadmapResult ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-600" /> Synthesize Preparation Roadmap
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                We analyze your current skill matrix against your targets to create an optimized gap-analysis learning sequence.
              </p>
            </div>

            <form onSubmit={handleGenerateRoadmap} className="space-y-6">
              
              {/* Conditional Profile View Handling */}
              {hasCachedResume ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Linked Stored Profile Found</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Your existing vector data, skills, and past experience will be automatically extracted from the database. No upload required.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Upload Profile Data (Required Once)</label>
                  <div 
                    onDragOver={handleDragOver} 
                    onDragLeave={handleDragLeave} 
                    onDrop={handleDrop} 
                    onClick={() => inputRef.current.click()} 
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'}`}
                  >
                    <UploadCloud size={28} className="mx-auto text-indigo-600 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">{file ? file.name : "Drag & Drop your PDF Resume"}</h3>
                    <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    <button type="button" className="mt-3 bg-white border border-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-[11px] shadow-2xs">Browse Files</button>
                  </div>
                </div>
              )}

              {/* Goal parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Briefcase size={12} /> Target Role / Goal
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g., MERN Stack Developer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar size={12} /> Timeline (Days Available)
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="e.g., 30"
                    value={availableTime}
                    onChange={(e) => setAvailableTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Synthesizing Target Gap Analysis...
                  </>
                ) : (
                  "Generate My Roadmap Plan"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Roadmap Presentation Render Layout */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
                  Custom AI Roadmap Plan
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Targeting: {targetRole}</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Custom timeline structured precisely for a {availableTime}-day block.
                </p>
              </div>
              <button 
                onClick={() => setRoadmapResult(null)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Reset & Rebuild
              </button>
            </div>

            {/* Render interactive UI layout if steps schema array exists */}
            {roadmapResult?.steps && Array.isArray(roadmapResult.steps) ? (
              <div className="relative pl-2 before:absolute before:inset-0 before:left-4 sm:before:left-6 before:h-full before:w-0.5 before:bg-slate-200 space-y-8">
                {roadmapResult.steps.map((stepItem, index) => (
  <div key={index} className="relative pl-10 sm:pl-12 group transition-all">
    
    {/* Timeline Tracker Node Badge */}
    <div className="absolute left-1.5 sm:left-3 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors z-10">
      {index + 1}
    </div>
    
    {/* Step Content Container Box */}
    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:bg-white hover:border-indigo-200 transition-all space-y-4">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {stepItem.title}
        </h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shrink-0 self-start sm:self-center">
          <Clock size={12} />
          {stepItem.duration}
        </span>
      </div>

      {/* Trust Element: The Rationale (Why this matters) */}
      {stepItem.rationale && (
        <p className="text-xs bg-indigo-50/40 text-indigo-900 px-3 py-2 rounded-xl border border-indigo-100/50 italic font-medium">
          💡 <span className="font-bold">Why this step:</span> {stepItem.rationale}
        </p>
      )}
      
      {/* Concept Description */}
      <p className="text-slate-600 text-sm leading-relaxed font-medium">
        {stepItem.description}
      </p>

      {/* Trust Element: Hands-on Practical Project Build */}
      {stepItem.handsOnProject && (
        <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Practical Build Target</h5>
          <p className="text-xs text-slate-700 font-semibold">{stepItem.handsOnProject}</p>
        </div>
      )}
      
      {/* Sub-Milestones Checklist Render */}
      {stepItem.milestones && stepItem.milestones.length > 0 && (
        <div className="pt-3 border-t border-slate-200/60 space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Action Targets & Core Milestones
          </h4>
          <ul className="grid grid-cols-1 gap-2">
            {stepItem.milestones.map((milestone, mIdx) => (
              <li key={mIdx} className="flex items-start gap-2.5 text-slate-700 text-xs font-medium">
                <CheckSquare size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <span>{milestone}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trust Element: Vetted Links & Documentation */}
      {stepItem.trustedResources && stepItem.trustedResources.length > 0 && (
        <div className="pt-2 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Recommended Paths:</span>
          {stepItem.trustedResources.map((resource, rIdx) => (
            <span key={rIdx} className="text-[11px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md border border-slate-300/30">
              {resource}
            </span>
          ))}
        </div>
      )}
    </div>

  </div>
  ))}
              </div>
            ) : (
              /* Safe Structural Fallback Log Layout Wrapper */
              <div className="bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner leading-relaxed whitespace-pre-wrap">
                {typeof roadmapResult === 'string' ? roadmapResult : JSON.stringify(roadmapResult, null, 2)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AspirantRoadmap;