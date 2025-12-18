import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Preloader from './Preloader';

// --- Icon Components (Heroicons) ---
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 9.25v1.5l-7.598 1.52a.75.75 0 00-.95.826l-1.414 4.949a.75.75 0 00.826.95l16-8a.75.75 0 000-1.318l-16-8z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;

const languages = [ { code: 'ta', name: 'Tamil' }, { code: 'hi', name: 'Hindi' }, { code: 'te', name: 'Telugu' }, { code: 'kn', name: 'Kannada' }, { code: 'ml', name: 'Malayalam' }, { code: 'bn', name: 'Bengali' }, { code: 'mr', name: 'Marathi' }, { code: 'gu', name: 'Gujarati' }, { code: 'pa', name: 'Punjabi' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' }, { code: 'de', name: 'German' }, { code: 'ja', name: 'Japanese' }, { code: 'ar', name: 'Arabic' }, { code: 'ru', name: 'Russian' }];

function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalReportText, setOriginalReportText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ta');
  const [translatedSummary, setTranslatedSummary] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setAppLoading(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const resetOutputs = () => {
    setSummary('');
    setChatHistory([]);
    setOriginalReportText('');
    setTranslatedSummary('');
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setTextInput('');
      resetOutputs();
    }
  };

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
    if (summary) resetOutputs();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!textInput && !selectedImage) {
      setError('Please provide a medical report to analyze.');
      return;
    }
    setIsLoading(true);
    resetOutputs();

    try {
      let response;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('reportImage', selectedImage);
        response = await fetch('http://localhost:5001/api/summarize-image', { method: 'POST', body: formData });
      } else {
        response = await fetch('http://localhost:5001/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportText: textInput }),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `An error occurred.`);
      }
      const data = await response.json();
      setSummary(data.summary);
      setOriginalReportText(data.originalText || textInput);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newQuestion = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, newQuestion]);
    setIsChatLoading(true);
    setChatInput('');
    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalReport: originalReportText, userQuestion: chatInput }),
      });
      if (!response.ok) throw new Error('Failed to get a response.');
      const data = await response.json();
      const aiResponse = { role: 'assistant', content: data.answer };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (err) {
      const errorResponse = { role: 'assistant', content: `Sorry, an error occurred.` };
      setChatHistory(prev => [...prev, errorResponse]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!summary) return;
    setIsTranslating(true);
    setTranslatedSummary('');
    setError('');
    try {
      const targetLanguageName = languages.find(l => l.code === selectedLanguage)?.name;
      const response = await fetch('http://localhost:5001/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textToTranslate: summary, targetLanguage: targetLanguageName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed.');
      }
      const data = await response.json();
      setTranslatedSummary(data.translatedText);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  if (appLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="fixed inset-0 -z-10 h-full w-full bg-gray-100 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <AnimatePresence>
        <motion.div 
          className="max-w-4xl mx-auto space-y-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <header className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-sky-700 pb-2"
            >
              AI Medical Report Reader
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 mt-2"
            >
              Simplify your medical reports instantly.
            </motion.p>
          </header>

          <motion.main 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl shadow-slate-950/50 p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="report-text" className="font-semibold text-slate-300">Paste your report:</label>
                  <textarea id="report-text" rows="10" className="w-full p-3 bg-slate-900/70 rounded-lg border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all duration-300 disabled:opacity-50 text-slate-200" placeholder="GLUCOSE: 95 mg/dL..." value={textInput} onChange={handleTextInputChange} disabled={!!selectedImage || isLoading}></textarea>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Or upload an image:</label>
                  <div className="flex items-center justify-center bg-slate-900/70 p-6 rounded-lg border-2 border-dashed border-slate-700 h-full">
                    {selectedImage ? (
                      <div className="text-center">
                        <img src={URL.createObjectURL(selectedImage)} alt="Report preview" className="max-h-40 rounded-md mx-auto mb-3" />
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-sm text-slate-300 truncate w-48">{selectedImage.name}</p>
                          <motion.button type="button" onClick={handleRemoveImage} className="bg-red-500/20 text-red-400 p-1.5 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isLoading}><CloseIcon /></motion.button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="report-image" className="cursor-pointer flex flex-col items-center text-center text-slate-500 hover:text-cyan-400 transition-colors">
                        <UploadIcon />
                        <span className="mt-2 text-sm">Click to upload</span>
                      </label>
                    )}
                    <input id="report-image" type="file" className="hidden" accept="image/*" onChange={handleImageChange} ref={fileInputRef} disabled={isLoading} />
                  </div>
                </div>
              </div>
              <div className="text-center pt-2">
                <motion.button type="submit" className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold py-3 px-10 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/20 disabled:bg-slate-600 disabled:shadow-none" disabled={isLoading || isChatLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  {isLoading ? 'Analyzing...' : 'Generate Summary'}
                </motion.button>
              </div>
            </form>
          </motion.main>

          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-center items-center flex-col space-y-3">
                <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-gray-300 border-b-gray-300 border-l-gray-300 rounded-full animate-spin"></div>
                <p className="text-gray-500">Processing your report...</p>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-center">
                <p>{error}</p>
              </motion.div>
            )}

            {summary && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg p-6 text-slate-200">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 mb-4">Your Simplified Summary</h2>
                  <div className="whitespace-pre-wrap leading-relaxed prose prose-invert prose-p:text-slate-300 prose-strong:text-slate-100">{summary}</div>

                  <div className="mt-6 pt-6 border-t border-slate-700 flex items-center gap-4 flex-wrap">
                    <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-slate-900/70 border border-slate-600 text-slate-200 rounded-full py-2 px-4 focus:ring-cyan-500">
                      {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                    <motion.button onClick={handleTranslate} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-full" disabled={isTranslating} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {isTranslating ? 'Translating...' : 'Translate'}
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {translatedSummary && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-blue-300">Translated Summary:</h3>
                        <p className="text-slate-300 whitespace-pre-wrap">{translatedSummary}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 mb-4">Ask a Follow-up Question</h2>
                  <div className="h-64 overflow-y-auto mb-4 p-3 space-y-4 bg-slate-900/50 rounded-lg">
                    {chatHistory.map((msg, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-md text-white ${msg.role === 'user' ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {isChatLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="p-3 rounded-2xl bg-slate-700"><div className="flex items-center space-x-2"><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div></div></div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleChatSubmit} className="flex space-x-3">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="What does WBC mean?" className="flex-grow p-3 bg-slate-700/80 rounded-full border border-slate-600 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none" disabled={isChatLoading} />
                    <motion.button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-full disabled:bg-slate-600" disabled={isChatLoading || !chatInput.trim()} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><SendIcon /></motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;

