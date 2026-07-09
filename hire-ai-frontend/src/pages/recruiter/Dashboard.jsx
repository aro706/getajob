import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, Briefcase, Sparkles, User, CheckCircle2, 
  LogOut, AlertCircle, Loader2, Award, Building2 
} from 'lucide-react';

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Form State for Job Matching
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Live Backend Results State
  const [matchedCategories, setMatchedCategories] = useState([]);
  const [topCandidates, setTopCandidates] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Connects directly to server/controllers/jobController.js -> /api/jobs/post
  const handleVectorMatch = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please provide both a Job Title and a detailed Description for accurate vector matching.');
      return;
    }

    setIsSearching(true);
    setError('');
    setHasSearched(false);

    try {
      const response = await axios.post('http://localhost:5000/api/jobs/post', {
        title: jobTitle.trim(),
        description: jobDescription.trim()
      });

      setMatchedCategories(response.data.data.matchedJobCategories || []);
      setTopCandidates(response.data.data.topCandidates || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Vector search failed:', err);
      setError(err.response?.data?.error || 'Failed to query vector database. Ensure backend is running.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            H
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            HireAI <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-medium ml-1">Recruiter Command</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800">{user?.name || 'Recruiter Portal'}</span>
            <span className="text-xs text-slate-500">{user?.email || 'Talent Acquisition'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Job Input Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm sticky top-24">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Sparkles size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Vector Match Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Source Top Candidates</h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Paste your requirements. Our embedding service will vector-search the Resumes collection for the highest cosine similarity.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVectorMatch} className="space-y-5">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Target Role / Job Title
              </label>
              <input
                id="jobTitle"
                type="text"
                placeholder="e.g. Senior Full Stack Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="jobDescription" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Job Description & Required Tech Stack
              </label>
              <textarea
                id="jobDescription"
                rows="6"
                placeholder="Detail required skills, frameworks, and experience levels (e.g. Must have strong experience in MERN stack, Node.js microservices, and AWS deployment...)"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all resize-none leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Computing Embeddings & Matching...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Run AI Vector Search</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Candidate Results */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Category Classification Badge */}
          {matchedCategories.length > 0 && (
            <div className="bg-indigo-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <Award className="text-indigo-400" size={24} />
                <div>
                  <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Indexed Category Matches</p>
                  <p className="text-sm font-bold mt-0.5">Vector space aligned with: <span className="text-indigo-200 font-normal">{matchedCategories.join(', ')}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Candidates Feed */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {hasSearched ? `Ranked Candidates (${topCandidates.length})` : 'Awaiting Query'}
              </h3>
              {hasSearched && (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium border border-emerald-200">
                  Live DB Results
                </span>
              )}
            </div>

            {!hasSearched && !isSearching && (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400">
                <Briefcase size={48} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium text-slate-600">No active search</p>
                <p className="text-xs text-slate-400 mt-1">Enter a job description on the left to pull candidates from your database.</p>
              </div>
            )}

            {isSearching && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <Loader2 size={40} className="mx-auto mb-4 text-indigo-600 animate-spin" />
                <p className="font-semibold text-slate-800">Vectorizing Job Description...</p>
                <p className="text-xs text-slate-400 mt-1">Performing $vectorSearch aggregation across stored candidate embeddings.</p>
              </div>
            )}

            {hasSearched && topCandidates.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <User size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-700">No candidates met the threshold</p>
                <p className="text-sm text-slate-400 mt-1">Try broadening your description or uploading more resumes to MongoDB.</p>
              </div>
            )}

            {topCandidates.map((cand) => (
              <div 
                key={cand.resumeId} 
                className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex shrink-0 items-center justify-center text-slate-600 font-bold">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        Candidate ID: <span className="font-mono text-xs text-slate-500">{cand.resumeId.slice(-6)}</span>
                      </h4>
                      <div className="text-slate-500 text-xs mt-1 space-y-1">
                        {cand.experience && cand.experience.length > 0 ? (
                          cand.experience.map((exp, idx) => (
                            <p key={idx} className="flex items-center gap-1.5">
                              <Building2 size={13} className="text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-700">{exp.role || 'Engineer'}</span> at {exp.company || 'Tech Corp'}
                            </p>
                          ))
                        ) : (
                          <p className="italic text-slate-400">Experience details indexed in raw resume</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100 inline-block">
                      {cand.matchScore}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Similarity</p>
                  </div>
                </div>

                {/* Skills Tags */}
                {cand.skills && cand.skills.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {cand.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-medium border border-slate-200/60 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

          </div>
        </div>
      </main>
    </div>
  );
};

export default RecruiterDashboard;