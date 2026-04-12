import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Terminal, Briefcase, Users, Mail } from 'lucide-react';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { id: 1, title: 'Initialize God Mode', icon: <Terminal size={16} />, action: () => navigate('/aspirant/dashboard') },
    { id: 2, title: 'View Match Matrix', icon: <Briefcase size={16} />, action: () => navigate('/aspirant/results') },
    { id: 3, title: 'Recruiter Command Center', icon: <Users size={16} />, action: () => navigate('/recruiter/dashboard') },
    { id: 4, title: 'Active Outreach', icon: <Mail size={16} />, action: () => navigate('/aspirant/results') },
  ];

  const filteredCommands = commands.filter(cmd => cmd.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-blue-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-blue-950 border border-blue-800 rounded-xl shadow-2xl overflow-hidden font-sans"
          >
            <div className="flex items-center px-4 py-3 border-b border-blue-800">
              <Search className="text-blue-400 mr-3" size={20} />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-blue-50 placeholder-blue-400 outline-none font-mono text-sm"
              />
              <span className="text-xs text-blue-300 font-mono bg-blue-900 px-2 py-1 rounded">ESC</span>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <p className="text-blue-400 text-center py-4 text-sm font-mono">No commands found.</p>
              ) : (
                filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left text-sm text-blue-200 hover:bg-sky-500/10 hover:text-sky-400 rounded-lg transition-colors group cursor-pointer"
                  >
                    <span className="text-blue-400 group-hover:text-sky-400 transition-colors">{cmd.icon}</span>
                    <span className="font-medium">{cmd.title}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;