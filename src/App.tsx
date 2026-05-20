import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fingerprint, 
  Home, 
  Activity, 
  FileText, 
  Camera,
  Download, 
  Upload,
  ShieldCheck, 
  Video, 
  MapPin, 
  Clock, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Leaf,
  X,
  CheckCircle2,
  Calendar,
  Wand2,
  Sparkles,
  Store,
  MessageSquare,
  Search,
  Send
} from 'lucide-react';
import { ThreeDPlaneViewer } from './components/ThreeDPlaneViewer';

// --- Types & Constants ---

enum Screen {
  AUTH = 'auth',
  HOME = 'home',
  STUDIO = 'studio',
  REPORT = 'report',
  TIMELINE = 'timeline',
  LEGAL = 'legal'
}

// --- Components ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void, key?: any }) => (
  <motion.div 
    whileHover={onClick ? { scale: 1.02 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`liquid-glass p-6 relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const Modal = ({ isOpen, onClose, title, children, className = "" }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, className?: string }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[101] liquid-glass p-8 ${className}`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em]">{title}</h3>
            <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.AUTH);
  const [isScanning, setIsScanning] = useState(false);
  
  // Modal states
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [signedDocs, setSignedDocs] = useState<string[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ show: boolean, message: string }>({ show: false, message: "" });
  const [isAuthFailed, setIsAuthFailed] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // New States for AI and Marketplace
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
  const [isContracting, setIsContracting] = useState<string | null>(null);
  const [hasContracted, setHasContracted] = useState<string | null>(null);

  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Olá, Sra. Gabriela. Como Diretor de Projetos da Floory, estou à sua disposição. O PR-NEY está atualmente na fase de Verniz Final. Como posso ajudar hoje?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Simulation states
  const [isVeoProcessing, setIsVeoProcessing] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [hasAudited, setHasAudited] = useState(false);
  const [techThinkingStep, setTechThinkingStep] = useState(0); // 0: Thinking, 1: Final
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);

  // Studio Screen States
  const [studioStyle, setStudioStyle] = useState<'original' | 'chrome' | 'xray'>('original');
  const [studioLighting, setStudioLighting] = useState<'hangar' | 'aurora' | 'sunset'>('hangar');
  const [studioPrompt, setStudioPrompt] = useState('');
  const [isStudioProcessing, setIsStudioProcessing] = useState(false);
  const [studioStatusMessage, setStudioStatusMessage] = useState('');

  const handleProcessStudioAi = () => {
    if (!studioPrompt.trim()) return;
    setIsStudioProcessing(true);
    
    const steps = [
      "Consultando Gemini 3.5 Pro...",
      "Analisando volumetria do Bombardier...",
      "Modelando refletores cromados no hangar virtual...",
      "Processando verniz super-hidrofóbico...",
      "Design finalizado com sucesso pela IA!"
    ];

    let currentStep = 0;
    setStudioStatusMessage(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setStudioStatusMessage(steps[currentStep]);
      } else {
        clearInterval(interval);
        
        // Match user's command to styles dynamically
        const lowerPrompt = studioPrompt.toLowerCase();
        if (lowerPrompt.includes('chrome') || lowerPrompt.includes('violet') || lowerPrompt.includes('prata') || lowerPrompt.includes('metal') || lowerPrompt.includes('ouro') || lowerPrompt.includes('gold')) {
          setStudioStyle('chrome');
        } else if (lowerPrompt.includes('xray') || lowerPrompt.includes('vento') || lowerPrompt.includes('wind') || lowerPrompt.includes('aerodinamica')) {
          setStudioStyle('xray');
        } else {
          // toggle or other default
          setStudioStyle(prev => prev === 'chrome' ? 'original' : 'chrome');
        }

        setIsStudioProcessing(false);
        setStudioStatusMessage('');
        showCustomAlert("Textura processada e instalada pelo Gemini!");
      }
    }, 600);
  };

  // Simular reset de tecnologia ao entrar na aba
  useEffect(() => {
    if (currentScreen === Screen.REPORT) {
      setTechThinkingStep(0);
      setThinkingMessageIndex(0);
    }
  }, [currentScreen]);

  const startAuth = () => {
    setIsScanning(true);
    setIsAuthFailed(false);
    setTimeout(() => {
      setCurrentScreen(Screen.HOME);
      setIsScanning(false);
    }, 2500);
  };

  const handleSimulateFail = () => {
    setIsAuthFailed(true);
    setIsScanning(false);
  };

  const showCustomAlert = (message: string) => {
    setAlertConfig({ show: true, message });
    setTimeout(() => setAlertConfig({ show: false, message: "" }), 3000);
  };

  const handleConfirmCall = () => {
    if (!selectedTimeSlot) return;
    setIsCallModalOpen(false);
    showCustomAlert("Agendamento Confirmado!");
    setSelectedTimeSlot(null);
  };

  const handleOpenDoc = (name: string) => {
    setSelectedDoc(name);
    setIsDocModalOpen(true);
  };

  const handleSignDoc = () => {
    if (signedDocs.includes(selectedDoc)) return;
    setIsSigning(true);
    setTimeout(() => {
      setSignedDocs(prev => [...prev, selectedDoc]);
      setIsSigning(false);
      showCustomAlert("Documento assinado e registrado na Blockchain!");
    }, 1500);
  };

  const handleAiProcess = async () => {
    if (!aiPrompt) return;
    setIsAiProcessing(true);
    setGeneratedImageUrl(null);
    
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        showCustomAlert("Novo conceito gerado via Nano Banana.");
      } else {
        throw new Error(data.error || "Erro na geração");
      }
    } catch (error) {
      console.error(error);
      showCustomAlert("Falha ao gerar imagem. Tente novamente.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleVeoAnimation = () => {
    setIsVeoProcessing(true);
    setTimeout(() => {
      setIsVeoProcessing(false);
      showCustomAlert("Vídeo 3D gerado e salvo na Galeria do Hangar.");
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatTyping) return;
    
    const newUserMsg = { role: 'user' as const, content: chatInput };
    const updatedMessages = [...chatMessages, newUserMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, tive uma falha de conexão com a rede Floory. Podemos tentar novamente?" }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleQualityAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setHasAudited(true);
      showCustomAlert("Laudo IA: Aplicação de primer uniforme. Padrão Floory atingido.");
    }, 2000);
  };

  const handleResetAi = () => {
    setAiPrompt("");
    setGeneratedImageUrl(null);
  };

  const handleContract = (id: string) => {
    setIsContracting(id);
    setTimeout(() => {
      setIsContracting(null);
      setHasContracted(id);
      showCustomAlert("Oficina notificada.");
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans">
      <div className="aurora-bg" />
      
      {/* Alert Notification */}
      <AnimatePresence>
        {alertConfig.show && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] liquid-glass border-emerald-500/30 px-6 py-3 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">{alertConfig.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-1 w-full mx-auto relative ${currentScreen === Screen.STUDIO ? 'h-screen pb-0 overflow-hidden' : 'max-w-md px-6 pt-12 pb-32 overflow-y-auto'}`}>
        <AnimatePresence mode="wait">
          {currentScreen === Screen.AUTH && (
            <AuthScreen 
              key="auth" 
              onAuth={startAuth} 
              isScanning={isScanning} 
              isFailed={isAuthFailed}
              onRetry={() => setIsAuthFailed(false)}
              onSimulateFail={handleSimulateFail}
              showCustomAlert={showCustomAlert}
            />
          )}
          {currentScreen === Screen.HOME && (
            <>
              <HomeScreen 
                key="home" 
                onOpenCall={() => setIsCallModalOpen(true)} 
                onOpenAi={() => setIsAiModalOpen(true)}
                onOpenFleet={() => setIsFleetModalOpen(true)}
              />
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-purple-600 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center z-40"
              >
                <Sparkles className="w-6 h-6 text-white glow-icon" />
              </motion.button>
            </>
          )}
          {currentScreen === Screen.STUDIO && (
            <StudioScreen
              key="studio"
              studioStyle={studioStyle}
              studioLighting={studioLighting}
              setStudioStyle={setStudioStyle}
              setStudioLighting={setStudioLighting}
              studioPrompt={studioPrompt}
              setStudioPrompt={setStudioPrompt}
              isStudioProcessing={isStudioProcessing}
              handleProcessStudioAi={handleProcessStudioAi}
              studioStatusMessage={studioStatusMessage}
              showCustomAlert={showCustomAlert}
            />
          )}
          {currentScreen === Screen.REPORT && (
            <ReportScreen 
              key="report" 
              onOpenMarketplace={() => setIsMarketplaceModalOpen(true)} 
              onOpenChat={() => setIsChatOpen(true)}
            />
          )}
          {currentScreen === Screen.TIMELINE && (
            <TimelineScreen 
              key="timeline" 
              onOpenCall={() => setIsCallModalOpen(true)} 
              onDownload={() => showCustomAlert("Mídia salva na galeria em alta resolução")} 
              onOpenImage={(img) => setLightboxImage(img)}
              handleQualityAudit={handleQualityAudit}
              isAuditing={isAuditing}
              hasAudited={hasAudited}
            />
          )}
          {currentScreen === Screen.LEGAL && (
            <LegalScreen key="legal" onOpenDoc={handleOpenDoc} signedDocs={signedDocs} />
          )}
        </AnimatePresence>
      </main>

      {currentScreen !== Screen.AUTH && (
        <BottomNav current={currentScreen} onChange={setCurrentScreen} />
      )}

      {/* Modals */}
      <Modal 
        isOpen={isCallModalOpen} 
        onClose={() => setIsCallModalOpen(false)} 
        title="Agendamento Técnico"
      >
        <div className="space-y-6">
          <p className="text-[11px] text-white/60 leading-relaxed uppercase tracking-wider">
            Selecione um horário para alinhamento técnico com a Engenharia e o Diretor de Projeto.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {["10:00 - Hoje", "14:30 - Hoje", "09:00 - Amanhã", "11:00 - Amanhã"].map((time, i) => (
              <button 
                key={i} 
                className={`liquid-glass border-white/5 py-3 px-2 text-[10px] font-bold transition-all duration-300 ${selectedTimeSlot === time ? 'bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white' : 'text-white/80 hover:border-purple-500/50'}`}
                onClick={() => setSelectedTimeSlot(time)}
              >
                {time}
              </button>
            ))}
          </div>
          <button 
            onClick={handleConfirmCall}
            disabled={!selectedTimeSlot}
            className={`w-full py-4 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-500 ${selectedTimeSlot ? 'bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
          >
            Confirmar Agendamento
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isAiModalOpen} 
        onClose={() => {
          setIsAiModalOpen(false);
          // Wait for exit animation to clear states
          setTimeout(handleResetAi, 300);
        }} 
        title="AI Concept Generator (NB2)"
      >
        <div className="space-y-6">
          {!generatedImageUrl ? (
            <>
              <p className="text-[11px] text-white/60 leading-relaxed uppercase tracking-wider">
                Descreva sua visão estética para a inteligência generativa Floory criar um novo layout de pintura.
              </p>
              <div className="space-y-2">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Pintura fosca com detalhes em ouro..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                />
              </div>
              <button 
                onClick={handleAiProcess}
                disabled={isAiProcessing || !aiPrompt}
                className={`w-full py-4 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-500 flex items-center justify-center gap-2 ${aiPrompt && !isAiProcessing ? 'bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-white/20'}`}
              >
                {isAiProcessing ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                    />
                    <span>Processando DNA Floory...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Gerar Design Exclusivo</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center"
            >
              <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                <img 
                  src={generatedImageUrl} 
                  alt="AI Concept" 
                  className="w-full aspect-video object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[8px] text-white/60 uppercase italic truncate">"{aiPrompt}"</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleResetAi}
                  className="flex-1 py-3 liquid-glass border-white/10 text-[10px] uppercase font-bold tracking-widest"
                >
                  Novo Prompt
                </button>
                <button 
                  onClick={handleVeoAnimation}
                  disabled={isVeoProcessing}
                  className="flex-1 py-3 bg-purple-600/30 border border-purple-500/30 rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                >
                  {isVeoProcessing ? (
                    <>
                      <div className="spinner-sm border-t-white" />
                      <span>Veo 3.1...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3 h-3" />
                      <span>Animar (Veo 3.1)</span>
                    </>
                  )}
                </button>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="w-full py-3 bg-emerald-600 rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-2"
              >
                Aprovar Conceito
              </button>
            </motion.div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isFleetModalOpen} 
        onClose={() => setIsFleetModalOpen(false)} 
        title="Gerenciar Frota Corporativa"
      >
        <div className="space-y-4">
          {[
            { id: 'NEY', name: 'Bombardier Global 6000', prefix: 'PR-NEY', status: 'Em Execução', active: true },
            { id: 'XYZ', name: 'Gulfstream G650', prefix: 'PT-XYZ', status: 'Aguardando Design', active: false },
            { id: 'ABC', name: 'Cessna Citation', prefix: 'PR-ABC', status: 'Entregue', active: false }
          ].map((jet) => (
            <GlassCard 
              key={jet.id} 
              onClick={() => {
                if (!jet.active) {
                  showCustomAlert("Acesso restrito no protótipo. Permanecendo no PR-NEY.");
                  setIsFleetModalOpen(false);
                }
              }}
              className={`p-4 border-white/5 flex items-center justify-between transition-all ${jet.active ? 'border-purple-500/30 bg-purple-500/5' : 'hover:bg-white/5'}`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-white uppercase">{jet.name}</span>
                  {jet.active && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-[9px] text-white/40 font-mono">{jet.prefix}</span>
                  <span className={`text-[8px] uppercase tracking-wider font-bold ${jet.active ? 'text-purple-400' : 'text-white/20'}`}>{jet.status}</span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${jet.active ? 'text-purple-400' : 'text-white/20'}`} />
            </GlassCard>
          ))}
        </div>
      </Modal>

      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 h-[80vh] z-[101] bg-[#0A0A0A] border-t border-white/10 rounded-t-[32px] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest">Floory AI Assistant</h3>
                    <p className="text-[9px] text-emerald-400 font-medium uppercase tracking-widest">Always Syncing (Gemini 3.1 Pro)</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 text-white/30 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                    <div className={`${msg.role === 'user' ? 'bg-white/5 border border-white/10 rounded-tr-none' : 'bg-purple-600/10 border border-purple-500/20 rounded-tl-none'} px-4 py-3 rounded-2xl max-w-[85%] relative`}>
                      {msg.role === 'assistant' && (
                        <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                      )}
                      <p className={`text-[11px] leading-relaxed ${msg.role === 'user' ? 'text-white/80' : 'text-purple-100'}`}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isChatTyping && (
                  <div className="flex flex-col items-start gap-2">
                    <div className="bg-purple-600/10 border border-purple-500/20 px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] relative">
                      <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-1 h-1 bg-purple-400 rounded-full" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-purple-400 rounded-full" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-purple-400 rounded-full" />
                        </div>
                        <span className="text-[9px] text-purple-400 font-bold uppercase animate-pulse">Gemini 3.1 Pro analisando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative"
                >
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Consultar Floory AI..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/30"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isChatTyping}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${chatInput.trim() && !isChatTyping ? 'bg-purple-600' : 'bg-white/10 text-white/20'}`}>
                      <Send className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                </form>
                <p className="text-[8px] text-center mt-3 text-white/20 uppercase tracking-[0.2em]">Inspirado por Google Gemini 3.1 Pro</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxImage && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
            >
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-8 right-8 p-3 liquid-glass border-white/10 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <motion.img 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                src={lightboxImage} 
                alt="Lightbox View" 
                className="max-w-full max-h-[80vh] rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] border border-white/10 object-contain"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={isMarketplaceModalOpen} 
        onClose={() => setIsMarketplaceModalOpen(false)} 
        title="Smart Match Marketplace"
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[11px] text-white/60 leading-relaxed uppercase tracking-wider mb-2">
            Oficinas recomendadas com base na complexidade do projeto e certificações necessárias.
          </p>
          
          <div className="space-y-4">
            {[
              { id: 'avia', name: 'Avia Luxe Aviation Finishes', cert: 'Certificação ANAC-145', availability: 'Imediata' },
              { id: 'jetsp', name: 'JetPaint SP', cert: 'Certificação Internacional', availability: '15 dias' }
            ].map((shop) => (
              <GlassCard key={shop.id} className="p-4 border-white/5 bg-white/[0.03]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase text-white mb-1">{shop.name}</h4>
                    <p className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider">{shop.cert}</p>
                    <p className="text-[9px] text-white/40 uppercase mt-1">Disponibilidade: {shop.availability}</p>
                  </div>
                  <Store className="w-4 h-4 text-purple-400/50" />
                </div>
                
                {hasContracted === shop.id ? (
                  <div className="w-full py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">Oficina Notificada</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleContract(shop.id)}
                    disabled={!!isContracting}
                    className="w-full py-2 bg-purple-600 rounded-lg text-[9px] uppercase font-bold tracking-widest hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                  >
                    {isContracting === shop.id ? (
                      <div className="spinner-sm border-t-white" />
                    ) : (
                      "Contratar (Taxa Floory 2%)"
                    )}
                  </button>
                )}
              </GlassCard>
            ))}
          </div>

          {hasContracted && (
            <div className="liquid-glass border-emerald-500/30 p-4 bg-emerald-500/5 mt-2">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider leading-relaxed text-center">
                Contrato emitido na aba Legal.<br/>
                <span className="font-light opacity-80 text-white/70 italic">Consulte o painel de assinaturas para finalizar o protocolo.</span>
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
        title="Visualizador de Ativo"
      >
        <div className="space-y-6">
          <div className="p-4 liquid-glass border-white/5 bg-white/[0.02] max-h-[300px] overflow-y-auto">
            <h4 className="text-[12px] font-bold mb-4 uppercase text-purple-400">{selectedDoc}</h4>
            <p className="text-[10px] text-white/50 leading-relaxed font-light">
              ESTE DOCUMENTO É CONFIDENCIAL E PROPRIEDADE DA FLOORY AVIATION.<br/><br/>
              O presente instrumento tem por objeto a prestação de serviços de personalização "Bespoke" para a aeronave Bombardier Global 6000, prefixo PR-NEY. Os serviços incluem, mas não se limitam a: decapagem química total, aplicação de primer aeronáutico de alta aderência, pintura em 3 camadas com pigmentos metálicos exclusivos e verniz nano-cerâmico de alta resistência térmica.<br/><br/>
              A garantia de 10 anos cobre defeitos de fabricação e desbotamento por exposição UV, conforme laudo técnico anexo. A sustentabilidade do processo é garantida pelo sistema de filtragem de resíduos secos.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-4 liquid-glass border-white/10 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
            <button 
              onClick={handleSignDoc}
              disabled={isSigning}
              className={`flex-1 py-4 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] ${signedDocs.includes(selectedDoc) ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-purple-600'}`}
            >
              {isSigning ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner border-t-white" />
                  <span>Criptografando...</span>
                </div>
              ) : signedDocs.includes(selectedDoc) ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assinado</span>
                </div>
              ) : (
                "Assinar Digitalmente"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const AuthScreen = ({ onAuth, isScanning, isFailed, onRetry, onSimulateFail, showCustomAlert }: { onAuth: () => void, isScanning: boolean, isFailed: boolean, onRetry: () => void, onSimulateFail: () => void, showCustomAlert: (m: string) => void, key?: any }) => {
  const [isFidoLoading, setIsFidoLoading] = useState(false);

  const handleFidoClick = () => {
    setIsFidoLoading(true);
    setTimeout(() => {
      setIsFidoLoading(false);
      onAuth();
    }, 2000);
  };

  const handleFamilyOfficeClick = () => {
    showCustomAlert("Alerta enviado. Aguardando liberação remota do Administrador.");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-[80vh] flex flex-col items-center justify-center text-center px-4"
    >
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mb-12"
      >
        <div className="w-24 h-24 liquid-glass rounded-full flex items-center justify-center border-white/20 mb-4 mx-auto relative">
          <Zap className={`w-12 h-12 transition-colors duration-500 ${isFailed ? 'text-orange-500' : 'text-purple-400 glow-icon'} z-10`} />
          {(isScanning || isFidoLoading) && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border border-purple-500/50"
            />
          )}
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2 font-medium">Exclusividade</p>
        <h1 className="text-4xl font-light tracking-tighter text-white">FLOORY</h1>
        <p className="text-slate-400 font-light mt-2 tracking-widest text-xs uppercase opacity-60">Bespoke Aviation Aesthetics</p>
      </motion.div>

      <div className="relative w-full max-w-[320px] flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isFailed ? (
            <motion.div 
              key="id-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
              <GlassCard 
                onClick={!isScanning ? onAuth : undefined}
                className={`w-full py-12 flex flex-col items-center gap-6 cursor-pointer border-white/20 transition-all duration-500 ${isScanning ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]' : ''}`}
              >
                <div className="relative">
                  <Fingerprint className={`w-16 h-16 text-purple-400 transition-all duration-500 ${isScanning ? 'glow-icon' : 'opacity-40'}`} />
                  {isScanning && (
                    <motion.div 
                      animate={{ top: ['-20%', '120%'], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-[-20%] right-[-20%] h-0.5 bg-purple-400 shadow-[0_0_10px_#a855f7] z-20"
                    />
                  )}
                </div>
                <span className="text-[10px] uppercase opacity-70 tracking-widest font-bold">
                  {isScanning ? 'Escaneando Biometria...' : 'Autenticar Face ID'}
                </span>
              </GlassCard>
              
              <button 
                onClick={onSimulateFail}
                className="mt-6 text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                Simular Falha Biométrica
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="fail-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full space-y-4"
            >
              <div className="liquid-glass border-orange-500/30 p-6 bg-orange-500/5">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider leading-relaxed">
                  Falha na Verificação:<br/>
                  <span className="font-light opacity-80">O Face ID não conseguiu verificar sua identidade. Utilize um método alternativo.</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={handleFidoClick}
                  disabled={isFidoLoading}
                  className="w-full liquid-glass border-white/10 py-3 text-[9px] uppercase font-bold tracking-widest hover:bg-white/5 flex items-center justify-center gap-2"
                >
                  {isFidoLoading ? (
                    <>
                      <div className="spinner border-t-white" />
                      <span>Aguardando YubiKey...</span>
                    </>
                  ) : (
                    "Chave de Hardware FIDO2"
                  )}
                </button>
                <button 
                  onClick={handleFamilyOfficeClick}
                  className="w-full liquid-glass border-white/10 py-3 text-[9px] uppercase font-bold tracking-widest hover:bg-white/5"
                >
                  Aprovação Family Office
                </button>
                <button 
                  onClick={onRetry}
                  className="w-full py-3 text-[9px] uppercase font-bold tracking-widest text-purple-400 underline underline-offset-4"
                >
                  Tentar Face ID Novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.p 
        key={isScanning || isFidoLoading ? 'scanning' : isFailed ? 'failed' : 'idle'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-12 text-white/30 text-[10px] uppercase tracking-widest font-light h-10"
      >
        {isScanning || isFidoLoading ? (
          <>Iniciando a evolução estética:<br/><span className="text-white/60 font-semibold">Bombardier Global 6000</span></>
        ) : isFailed ? (
          "Protocolo de Segurança Ativo"
        ) : (
          "Cofre de Identidade Floory"
        )}
      </motion.p>
    </motion.div>
  );
};


const HomeScreen = ({ onOpenCall, onOpenAi, onOpenFleet }: { onOpenCall: () => void, onOpenAi: () => void, onOpenFleet: () => void, key?: any }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <header className="flex justify-between items-end">
      <div>
        <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-medium">Exclusividade Floory</p>
        <h2 className="text-xl font-light tracking-tight">Bom dia, <span className="font-semibold">Sra. Gabriela</span></h2>
      </div>
      <div className="w-10 h-10 rounded-full liquid-glass border border-white/20 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-purple-500/20">
        <img 
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" 
          alt="User" 
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
        />
      </div>
    </header>

    <div className="space-y-4">
      <GlassCard className="aspect-[4/3] p-0 group overflow-hidden border-white/30">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800" 
          alt="Jet Preview" 
          className="w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          <button 
            onClick={onOpenFleet}
            className="flex items-center gap-2 px-2 py-1 liquid-glass rounded-md text-[8px] uppercase font-bold tracking-wider border-white/20 hover:border-purple-500/50 transition-all active:scale-95"
          >
            <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
            AERONAVE: PR-NEY
            <ChevronDown className="w-2.5 h-2.5 text-white/50" />
          </button>
          <div className="flex items-center gap-2 px-2 py-1 liquid-glass rounded-md text-[8px] uppercase font-bold tracking-wider border-emerald-400/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            CONEXÃO SEGURA
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-20 text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Visualização Ativa</p>
          <h3 className="text-sm italic font-light">Bombardier Global 6000: Bespoke Floral</h3>
        </div>
      </GlassCard>

      <GlassCard className="aspect-[4/3] p-0 group overflow-hidden border-white/30 relative bg-[#09050d] flex items-center justify-center">
        {/* Dynamic decorative radar/sonar circles & coordinate overlays */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#9333ea 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        
        {/* Abstract vector representation of airport lines */}
        <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Main airport runway strip */}
          <line x1="10" y1="90" x2="90" y2="10" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Taxiways */}
          <line x1="25" y1="75" x2="75" y2="75" stroke="#10b981" strokeWidth="0.6" strokeDasharray="1 1" />
          <line x1="50" y1="50" x2="50" y2="90" stroke="#9333ea" strokeWidth="0.6" />
          <line x1="50" y1="50" x2="90" y2="50" stroke="#9333ea" strokeWidth="0.6" />
          {/* Airport range circles */}
          <circle cx="50" cy="50" r="15" fill="none" stroke="#a855f7" strokeWidth="0.3" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#a855f7" strokeWidth="0.3" strokeDasharray="4 4" />
        </svg>

        {/* Dynamic pulse / sonar beacon around centered MapPin */}
        <div className="relative flex items-center justify-center z-10">
          <motion.div 
            animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40"
          />
          <motion.div 
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30"
          />
          <div className="w-10 h-10 rounded-full bg-purple-600/90 border border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.5)] flex items-center justify-center relative">
            <MapPin className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>

        {/* Outer latitude/longitude coordinates to reinforce aesthetic accuracy */}
        <div className="absolute top-3 left-3 pointer-events-none text-[#9333ea]/80 font-mono text-[7px] uppercase tracking-wider">
          23.1819° S, 46.9406° W • SBJD Hangar 04
        </div>
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[7px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
            Sinal Estabilizado
          </span>
        </div>

        {/* Bottom address overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white">Hangar Jundiaí/SP</span>
              </div>
              <p className="text-[9px] text-white/60 mt-0.5 font-medium uppercase tracking-wider">R. Emilio Antonon, 1000 - Aeroporto Jundiaí</p>
            </div>
            <div className="text-right">
              <span className="text-[7.5px] bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold px-2 py-0.5 rounded uppercase tracking-widest font-mono inline-block">
                CONEXÃO VIA SATÉLITE (Mock)
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <GlassCard className="p-3 text-center rounded-2xl border-white/10">
        <p className="text-[8px] text-white/40 uppercase mb-1">Status</p>
        <p className="text-[10px] font-medium leading-tight">Verniz Final</p>
      </GlassCard>
      <GlassCard className="p-3 text-center rounded-2xl border-white/10">
        <p className="text-[8px] text-white/40 uppercase mb-1">Entrega</p>
        <p className="text-[10px] font-medium leading-tight">05 Abr</p>
      </GlassCard>
    </div>

    <section className="relative pr-16">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] uppercase tracking-widest text-white/60">Progresso Geral</span>
        <span className="text-[10px] font-bold text-purple-400">88%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '88%' }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-emerald-500 to-purple-600"
        />
      </div>
    </section>
  </motion.div>
);

const ReportScreen = ({ onOpenMarketplace, onOpenChat }: { 
  onOpenMarketplace: () => void, 
  onOpenChat: () => void,
  key?: any
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Top flex header with executive markings matching the requested bespoke aviation feel */}
      <header className="flex flex-col gap-1 border-b border-white/5 pb-4 px-1">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold tracking-tight text-white font-mono">PR-NEY</span>
          <span className="text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold px-3 py-1 rounded uppercase tracking-wider">
            Bespoke Aviation Aesthetics
          </span>
        </div>
        <h2 className="text-sm font-semibold tracking-wide uppercase text-emerald-400 mt-2">Relatório de Engenharia</h2>
        <p className="text-white/40 text-[9px] tracking-widest uppercase">Análise em tempo real do sistema Floory</p>
      </header>

      {/* Analytical Panel Cards styled under high-end Bespoke Aviation guidelines */}
      <div className="space-y-4">
        {[
          { label: 'Massa Adicional de Tinta', value: '+42,4 kg', desc: 'Massa adicional calibrada dentro dos limites operacionais da aeronave.' },
          { label: 'Arrasto Aerodinâmico', value: '-1,2% (Otimizada)', desc: 'Arrasto residual reduzido na camada limite folhada a cromo.' },
          { label: 'Certificação Estrutural', value: 'ANAC-145', desc: 'A homologação do hangar está em andamento sob ritos Bespoke.' },
        ].map((data, i) => (
          <GlassCard key={i} className="flex flex-col border-white/10 p-5 rounded-2xl bg-white/[0.02]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-medium opacity-60 uppercase tracking-wider">{data.label}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{data.value}</span>
            </div>
            <p className="text-[9.5px] text-white/40 leading-relaxed font-light">{data.desc}</p>
          </GlassCard>
        ))}
      </div>

      {/* Bottom Area containing AI Assistant Insight Report and actions */}
      <div className="space-y-4">
        <div className="liquid-glass p-4 bg-purple-500/5 border-purple-500/20 relative rounded-2xl">
          <p className="text-[9px] uppercase tracking-tighter opacity-50 mb-2 font-bold text-purple-300">Laudo Técnico (Gemini 3.5 Pro)</p>
          <p className="text-[11px] leading-relaxed italic text-purple-200">
            "A análise micro-aerodinâmica aponta que o acabamento nano-cerâmico reduz a turbulência superficial em Sharklets de forma eficiente, mantendo o consumo de biocombustível otimizado."
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onOpenChat}
            className="w-full py-4 bg-purple-600 rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            Consultar Floory AI
          </button>

          <button 
            onClick={onOpenMarketplace}
            className="w-full py-4 bg-emerald-600 rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Aprovar Projeto e Buscar Oficinas
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const StudioScreen = ({
  studioStyle,
  studioLighting,
  setStudioStyle,
  setStudioLighting,
  studioPrompt,
  setStudioPrompt,
  isStudioProcessing,
  handleProcessStudioAi,
  studioStatusMessage,
  showCustomAlert
}: {
  studioStyle: 'original' | 'chrome' | 'xray';
  studioLighting: 'hangar' | 'aurora' | 'sunset';
  setStudioStyle: React.Dispatch<React.SetStateAction<'original' | 'chrome' | 'xray'>>;
  setStudioLighting: React.Dispatch<React.SetStateAction<'hangar' | 'aurora' | 'sunset'>>;
  studioPrompt: string;
  setStudioPrompt: React.Dispatch<React.SetStateAction<string>>;
  isStudioProcessing: boolean;
  handleProcessStudioAi: () => void;
  studioStatusMessage: string;
  showCustomAlert: (m: string) => void;
  key?: any;
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Auto-expand panel when processing starts to display progress messages clearly
  useEffect(() => {
    if (isStudioProcessing) {
      setIsPanelOpen(true);
    }
  }, [isStudioProcessing]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full bg-[#030107] overflow-hidden"
    >
      {/* Principal full-bleed 3D canvas of the customer plane */}
      <div className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-500 ${isModelLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <ThreeDPlaneViewer 
          visualStyle={studioStyle} 
          lightingMode={studioLighting} 
          hideControls={true} 
        />
      </div>

      {/* Fullscreen premium upload dropzone for empty state */}
      {!isModelLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-black/45 backdrop-blur-2xl border border-dashed border-purple-500/30 hover:border-purple-500/50 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer group select-none"
            onClick={() => {
              setIsModelLoaded(true);
              setTimeout(() => {
                const el = document.getElementById('three-d-file-input');
                if (el) (el as HTMLInputElement).click();
              }, 150);
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-500">
              <Upload className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors animate-pulse" />
            </div>

            <span className="text-[9px] uppercase tracking-[0.25em] text-purple-400 font-extrabold font-mono block mb-2">Bespoke Aircraft Studio</span>
            <h3 className="text-base font-light tracking-tight text-white uppercase font-mono mb-2">
              Design Personalizado 3D
            </h3>
            
            <p className="text-[10px] text-gray-400 font-mono leading-relaxed mb-6 max-w-[240px]">
              Arraste seu modelo de avião aqui ou clique para selecionar. Suporta arquivos <span className="text-purple-300 font-bold">.GLB, .GLTF ou .FBX</span>.
            </p>

            <button
              type="button"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-[9px] uppercase tracking-widest font-black rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95 transition-all duration-300"
            >
              Carregar Modelo 3D
            </button>
          </motion.div>
        </div>
      )}

      {/* Floating Header details */}
      <div className="absolute top-12 left-6 right-6 z-10 flex justify-between items-center pointer-events-none select-none">
        <div>
          <span className="text-[7.5px] uppercase tracking-[0.2em] text-purple-400 font-semibold block mb-0.5 font-mono">Bespoke Design Studio</span>
          <h2 className="text-sm font-light tracking-tight text-white uppercase font-mono">ESTÚDIO DE IA</h2>
        </div>
        
        {/* Elite Client Model Upload Action */}
        {isModelLoaded && (
          <button
            onClick={() => {
              const el = document.getElementById('three-d-file-input');
              if (el) {
                (el as HTMLInputElement).click();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 active:scale-95 border border-white/10 rounded-full text-[8px] uppercase tracking-widest font-bold transition-all text-white/80 hover:text-white pointer-events-auto backdrop-blur-md cursor-pointer animate-fade-in"
          >
            <Upload className="w-3 h-3 text-purple-400" />
            <span>Upload do Modelo 3D</span>
          </button>
        )}
      </div>

      {/* Absolute positioning container at page bottom for the panel and its toggle */}
      {isModelLoaded && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md flex flex-col items-center gap-3.5 pointer-events-none">
        
        {/* Toggle Button (Attachment on top of panel when open, or sitting alone when closed) */}
        <button
          type="button"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="pointer-events-auto bg-black/40 hover:bg-black/65 backdrop-blur-md border border-white/10 rounded-full p-2.5 px-4 flex items-center gap-2 hover:border-purple-500/30 active:scale-95 transition-all text-white/95 cursor-pointer shadow-lg group select-none"
        >
          {isPanelOpen ? (
            <>
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold font-mono text-purple-300">Minimizar Designer</span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
            </>
          ) : (
            <>
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold font-mono text-purple-200 group-hover:text-purple-300 transition-colors">Personalizar com IA</span>
              <ChevronUp className="w-3.5 h-3.5 text-purple-400 group-hover:-translate-y-0.5 transition-transform animate-pulse" />
            </>
          )}
        </button>

        {/* Collapsible Panel with smooth AnimatePresence */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full bg-black/45 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl flex flex-col gap-3.5 pointer-events-auto select-none shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
            >
              {/* Segment 1: AI Prompt Command */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    value={studioPrompt}
                    onChange={(e) => setStudioPrompt(e.target.value)}
                    placeholder="Ex: Aplicar textura Violet Chrome..."
                    disabled={isStudioProcessing}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-[10px] text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors uppercase tracking-wider font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  </div>
                </div>
                <button
                  onClick={handleProcessStudioAi}
                  disabled={isStudioProcessing || !studioPrompt.trim()}
                  className={`w-full py-3 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    studioPrompt.trim() && !isStudioProcessing 
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                      : 'bg-white/5 text-white/30 pointer-events-none'
                  }`}
                >
                  {isStudioProcessing ? (
                    <span className="flex items-center gap-2">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full"
                      />
                      <span className="animate-pulse">{studioStatusMessage || 'Processando com IA...'}</span>
                    </span>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Processar Textura com IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Thin elegant separator line */}
              <div className="border-t border-white/5" />

              {/* Segment 2: Scene Environment Studio Lighting Pills */}
              <div>
                <span className="text-[7.5px] uppercase tracking-[0.2em] text-gray-400 font-light block mb-2 font-mono text-left">Iluminação Hangar</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setStudioLighting('hangar')}
                    className={`text-[8px] font-medium py-1.5 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${studioLighting === 'hangar' ? 'ring-1 ring-emerald-500/50 text-emerald-200 bg-emerald-500/5' : 'text-white/40 hover:text-white/75'}`}
                  >
                    VIP Hangar
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioLighting('aurora')}
                    className={`text-[8px] font-medium py-1.5 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${studioLighting === 'aurora' ? 'ring-1 ring-emerald-500/50 text-emerald-200 bg-emerald-500/5' : 'text-white/40 hover:text-white/75'}`}
                  >
                    Cosmic Laser
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioLighting('sunset')}
                    className={`text-[8px] font-medium py-1.5 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${studioLighting === 'sunset' ? 'ring-1 ring-emerald-500/50 text-emerald-200 bg-emerald-500/5' : 'text-white/40 hover:text-white/75'}`}
                  >
                    Sunset Gold
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
    </motion.div>
  );
};

const LegalScreen = ({ onOpenDoc, signedDocs }: { onOpenDoc: (n: string) => void, signedDocs: string[], key?: any }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <header>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Central de Certificações</span>
        <h2 className="text-xl font-light tracking-tight">Contratos e <span className="font-semibold">Legal</span></h2>
      </div>
    </header>

    <div className="space-y-2">
      {[
        "Contrato de Personalização Bespoke",
        "Garantia de Pintura (10 Anos)",
        "Laudo Técnico de Inspeção Pré-Voo",
        "Relatório de Ativos e Valorização"
      ].map((doc, i) => (
        <button 
          key={i} 
          onClick={() => onOpenDoc(doc)}
          className={`w-full liquid-glass flex items-center justify-between px-4 py-3 border-white/5 active:scale-95 transition-all group ${signedDocs.includes(doc) ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">{doc}</span>
            {signedDocs.includes(doc) && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </div>
          <Download className="w-3.5 h-3.5 text-white/30 group-hover:text-purple-400 group-hover:glow-icon transition-colors" />
        </button>
      ))}
    </div>

    <section className="space-y-4 pt-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Sustentabilidade & ESG</p>
      <div className="grid grid-cols-1 gap-3">
        {[
          { title: "Redução de Emissão", desc: "12t CO2 / ano através de gestão inteligente de resíduos.", icon: <Leaf className="w-4 h-4 text-emerald-400" /> },
          { title: "Pintura High-End", desc: "Descarte zero de resíduos químicos em solo certificado.", icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> }
        ].map((cert, i) => (
          <GlassCard key={i} className="flex flex-col border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              {cert.icon}
              <h4 className="text-[11px] font-bold uppercase tracking-wider">{cert.title}</h4>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed font-light">{cert.desc}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  </motion.div>
);

const TimelineScreen = ({ onOpenCall, onDownload, onOpenImage, handleQualityAudit, isAuditing, hasAudited }: { 
  onOpenCall: () => void, 
  onDownload: () => void, 
  onOpenImage: (img: string) => void,
  handleQualityAudit: () => void,
  isAuditing: boolean,
  hasAudited: boolean,
  key?: any
}) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <header className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Acompanhamento Visual</span>
      <h2 className="text-xl font-light tracking-tight">Timeline de <span className="font-semibold">Execução</span></h2>
    </header>

    <div className="space-y-4">
      <GlassCard className="p-0 border-white/10 overflow-hidden max-w-sm mx-auto">
        <img 
          src="https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=800" 
          alt="Polimento" 
          onClick={() => onOpenImage("https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=1200")}
          className="w-full h-32 object-cover brightness-75 hover:brightness-100 transition-all duration-500 cursor-zoom-in"
        />
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-white">Hoje - Polimento final</p>
              <p className="text-[10px] text-white/50">Inspeção de brilho e proteção nano.</p>
            </div>
            <button onClick={onDownload} className="p-1.5 liquid-glass border-white/10 hover:text-purple-400 transition-colors">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <button 
            onClick={handleQualityAudit}
            disabled={isAuditing || hasAudited}
            className={`w-full py-2 rounded-lg text-[9px] uppercase font-bold tracking-widest transition-all duration-500 flex items-center justify-center gap-2 ${hasAudited ? 'bg-emerald-600/30 border border-emerald-500/30 text-emerald-400' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
          >
            {isAuditing ? (
              <>
                <div className="spinner-sm border-t-white" />
                <span>Analisando fuselagem...</span>
              </>
            ) : hasAudited ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Laudo IA: Padrão Floory Atingido</span>
              </>
            ) : (
              <>
                <Camera className="w-3 h-3" />
                <span>Auditoria de Qualidade via IA</span>
              </>
            )}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 border-white/10 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=600" 
          alt="Pintura" 
          onClick={() => onOpenImage("https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=1200")}
          className="w-full h-48 object-cover grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-500 cursor-zoom-in"
        />
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-white/80">22/03 - Base metálica</p>
            <p className="text-[10px] text-white/50">Aplicação da base concluída no hangar.</p>
          </div>
          <button onClick={onDownload} className="p-2 liquid-glass border-white/10 hover:text-purple-400 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </div>

    <button 
      onClick={onOpenCall}
      className="w-full py-4 mt-2 liquid-glass border-purple-500/30 text-[10px] uppercase font-bold tracking-widest bg-purple-500/5 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2 group"
    >
      <Video className="w-4 h-4 text-purple-400 group-hover:glow-icon" />
      Solicitar Video-Call com Diretor
    </button>
  </motion.div>
);

const BottomNav = ({ current, onChange }: { current: Screen, onChange: (s: Screen) => void }) => {
  const items = [
    { id: Screen.HOME, icon: Home, label: 'Painel' },
    { id: Screen.STUDIO, icon: Wand2, label: 'STUDIO' },
    { id: Screen.REPORT, icon: Activity, label: 'Tech' },
    { id: Screen.TIMELINE, icon: Camera, label: 'Timeline' },
    { id: Screen.LEGAL, icon: FileText, label: 'Legal' },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 h-16 liquid-glass flex items-center justify-around border-white/20 z-50">
      {items.map((item) => {
        const isActive = current === item.id;
        const Icon = item.icon;
        
        return (
          <button 
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-purple-400' : 'opacity-40'}`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'glow-icon' : ''}`} />
            <span className="text-[8px] uppercase font-semibold">{item.label}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-glow"
                className="nav-glow"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default App;
