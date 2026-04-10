import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AspirantDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, complete
  const [logs, setLogs] = useState([]);
  
  const inputRef = useRef(null);

  const backendLogs = [
    "================================================",
    "1. Extracting, embedding, and saving resume...",
    "2. Finding top matching roles...",
    "3. Initiating Deep Search & AI Outreach...",
    ">> Processing specific vectors...",
    "   ✍️ Gemini is generating tailored outreach drafts...",
    "   🚀 Compiling verified HR contact points...",
    "4. GOD MODE COMPLETE!",
    "================================================"
  ];

  useEffect(() => {
    let timeoutIds = [];
    if (status === 'processing') {
      backendLogs.forEach((log, index) => {
        const id = setTimeout(() => {
          setLogs((prev) => [...prev, log]);
        }, index * 4500); 
        timeoutIds.push(id);
      });
    }
    return () => timeoutIds.forEach(clearTimeout);
  }, [status]);

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

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const initiatePipeline = async () => {
    if (!file) return;
    setStatus('processing');
    setLogs(["[SYSTEM] Initiating secure upload sequence..."]);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      // Connects to your backend controller's exact endpoint structure
      const response = await axios.post('http://localhost:5000/api/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setStatus('complete');
      
      // Automatically route to results and pass the ultimate pipeline data
      setTimeout(() => {
        navigate('/aspirant/results', { state: { pipelineData: response.data.data } });
      }, 2000);
      
    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, "⚠️ [ERROR] Pipeline failed. Check console."]);
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col font-montserrat">
      <div className="flex justify-between items-center mb-12 border-b border-dune-stone pb-4">
        <h1 className="text-4xl font-cinzel text-dune-sky tracking-widest uppercase">Aspirant Sanctuary</h1>
        <button onClick={logout} className="text-dune-spice hover:text-dune-sand transition text-sm uppercase tracking-wide cursor-pointer">
          Sever Connection
        </button>
      </div>

      {status === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div 
            className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-lg text-center transition-colors duration-300 ${dragActive ? 'border-dune-spice bg-dune-stone' : 'border-dune-tan hover:border-dune-sand'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />
            
            <svg className="mx-auto h-16 w-16 text-dune-tan mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
            <p className="text-xl text-dune-sand mb-2 font-bold">
              {file ? file.name : "Drag and drop your resume (PDF)"}
            </p>
            <p className="text-dune-tan mb-6 text-sm">or click to browse local records</p>
            
            <button onClick={() => inputRef.current.click()} className="bg-dune-stone text-dune-sand border border-dune-tan px-6 py-2 rounded hover:bg-dune-tan hover:text-dune-dark transition cursor-pointer mr-4 font-bold">
              Select File
            </button>
            
            {file && (
              <button onClick={initiatePipeline} className="bg-dune-spice text-dune-dark font-bold px-6 py-2 rounded hover:bg-orange-700 transition cursor-pointer mt-4 sm:mt-0">
                Initiate God Mode
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="flex-1 flex flex-col mt-8">
          <h2 className="text-2xl font-cinzel text-dune-spice mb-4 animate-pulse uppercase tracking-wider">Processing Spice Flow...</h2>
          
          <div className="bg-black/90 rounded-lg border border-dune-stone p-6 font-mono text-sm sm:text-base h-96 overflow-y-auto shadow-2xl">
            {logs.map((log, i) => (
              <div key={i} className={`mb-2 ${log.includes('GOD MODE') ? 'text-dune-spice font-bold' : log.includes('Gemini') ? 'text-dune-sky' : 'text-green-400'}`}>
                {log}
              </div>
            ))}
            <div className="text-dune-sand mt-4 animate-pulse">_</div>
          </div>
        </div>
      )}

      {status === 'complete' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
           <h2 className="text-4xl font-cinzel text-dune-sand mb-6 uppercase tracking-widest">Pipeline Secured</h2>
           <p className="text-dune-tan mb-6">Extracting matrix data and routing to dashboard...</p>
        </div>
      )}
    </div>
  );
};

export default AspirantDashboard;