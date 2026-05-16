import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fingerprint, 
  Home, 
  Activity, 
  FileText, 
  Download, 
  ShieldCheck, 
  Video, 
  MapPin, 
  Clock, 
  ChevronRight,
  Zap,
  Leaf,
  X,
  CheckCircle2,
  Calendar
} from 'lucide-react';

// --- Types & Constants ---

enum Screen {
  AUTH = 'auth',
  HOME = 'home',
  REPORT = 'report',
  LEGAL = 'legal'
}

// --- Components ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
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

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
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
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[101] liquid-glass p-8"
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

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.AUTH);
  const [isScanning, setIsScanning] = useState(false);
  
  // Modal states
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const startAuth = () => {
    setIsScanning(true);
    setTimeout(() => {
      setCurrentScreen(Screen.HOME);
      setIsScanning(false);
    }, 2500);
  };

  const handleConfirmCall = () => {
    setIsCallModalOpen(false);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleOpenDoc = (name: string) => {
    setSelectedDoc(name);
    setIsDocModalOpen(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans">
      <div className="aurora-bg" />
      
      {/* Alert Notification */}
      <AnimatePresence>
        {showAlert && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] liquid-glass border-emerald-500/30 px-6 py-3 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Agendamento Confirmado!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-12 pb-32 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentScreen === Screen.AUTH && (
            <AuthScreen key="auth" onAuth={startAuth} isScanning={isScanning} />
          )}
          {currentScreen === Screen.HOME && (
            <HomeScreen key="home" onOpenCall={() => setIsCallModalOpen(true)} />
          )}
          {currentScreen === Screen.REPORT && (
            <ReportScreen key="report" />
          )}
          {currentScreen === Screen.LEGAL && (
            <LegalScreen key="legal" onOpenDoc={handleOpenDoc} />
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
                className="liquid-glass border-white/5 py-3 px-2 text-[10px] font-bold text-white/80 hover:border-purple-500/50 transition-colors"
                onClick={() => {}}
              >
                {time}
              </button>
            ))}
          </div>
          <button 
            onClick={handleConfirmCall}
            className="w-full py-4 bg-purple-600 rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Confirmar Agendamento
          </button>
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
            <button className="flex-1 py-4 liquid-glass border-purple-500/30 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
            <button className="flex-1 py-4 bg-purple-600 rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              Assinar Digitalmente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const AuthScreen = ({ onAuth, isScanning }: { onAuth: () => void, isScanning: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="h-[80vh] flex flex-col items-center justify-center text-center"
  >
    <motion.div 
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="mb-12"
    >
      <div className="w-24 h-24 liquid-glass rounded-full flex items-center justify-center border-white/20 mb-4 mx-auto relative">
        <Zap className="w-12 h-12 text-purple-400 glow-icon z-10" />
        {isScanning && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-purple-500/50"
          />
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Exclusividade</p>
      <h1 className="text-4xl font-light tracking-tighter text-white">FLOORY</h1>
      <p className="text-slate-400 font-light mt-2 tracking-widest text-xs uppercase opacity-60">Bespoke Aviation Aesthetics</p>
    </motion.div>

    <div className="relative group">
      <GlassCard 
        onClick={!isScanning ? onAuth : undefined}
        className={`w-full max-w-[280px] py-12 flex flex-col items-center gap-6 cursor-pointer border-white/20 transition-all duration-500 ${isScanning ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]' : ''}`}
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
    </div>

    <motion.p 
      key={isScanning ? 'scanning' : 'idle'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-12 text-white/30 text-[10px] uppercase tracking-widest font-light h-10"
    >
      {isScanning ? (
        <>Iniciando a evolução estética:<br/><span className="text-white/60 font-semibold">Bombardier Global 6000</span></>
      ) : (
        "Cofre de Identidade Floory"
      )}
    </motion.p>
  </motion.div>
);

const HomeScreen = ({ onOpenCall }: { onOpenCall: () => void }) => (
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

    <GlassCard className="aspect-[4/3] p-0 group overflow-hidden border-white/30">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
      <img 
        src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800" 
        alt="Jet Preview" 
        className="w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-transform duration-1000"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
        <div className="flex items-center gap-2 px-2 py-1 liquid-glass rounded-md text-[8px] uppercase font-bold tracking-wider border-white/20">
          <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
          AERONAVE: PR-NEY
        </div>
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

    <div className="grid grid-cols-3 gap-3">
      <GlassCard className="p-3 text-center rounded-2xl border-white/10">
        <p className="text-[8px] text-white/40 uppercase mb-1">Hangar</p>
        <p className="text-[10px] font-medium leading-tight">Jundiaí SP</p>
      </GlassCard>
      <GlassCard className="p-3 text-center rounded-2xl border-white/10">
        <p className="text-[8px] text-white/40 uppercase mb-1">Status</p>
        <p className="text-[10px] font-medium leading-tight">Verniz Final</p>
      </GlassCard>
      <GlassCard className="p-3 text-center rounded-2xl border-white/10">
        <p className="text-[8px] text-white/40 uppercase mb-1">Entrega</p>
        <p className="text-[10px] font-medium leading-tight">05 Abr</p>
      </GlassCard>
    </div>

    <section>
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

    <section className="space-y-4">
      <h3 className="text-[10px] uppercase tracking-widest text-white/40">Timeline de Execução</h3>
      <div className="space-y-4 relative pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-[1px] bg-white/10" />
        {[
          { date: 'Hoje', title: 'Polimento final e inspeção de brilho nano.', active: true },
          { date: '22/03', title: 'Aplicação da base metálica concluída.', active: false },
        ].map((item, i) => (
          <div key={i} className="relative">
            <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full transition-all duration-500 ${item.active ? 'bg-purple-500 ring-4 ring-purple-500/20 shadow-[0_0_8px_#a855f7]' : 'bg-white/20'}`} />
            <div>
              <p className={`text-[11px] font-semibold ${item.active ? 'text-white' : 'text-white/80'}`}>{item.date}</p>
              <p className="text-[10px] text-white/50">{item.title}</p>
            </div>
          </div>
        ))}
        
        <button 
          onClick={onOpenCall}
          className="w-full py-4 mt-2 liquid-glass border-purple-500/30 text-[10px] uppercase font-bold tracking-widest hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2 group"
        >
          <Video className="w-4 h-4 text-purple-400 group-hover:glow-icon" />
          Solicitar Video-Call com Diretor
        </button>
      </div>
    </section>
  </motion.div>
);

const ReportScreen = () => {
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDataLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header>
        <h2 className="text-xl font-light tracking-tight uppercase text-emerald-400">Relatório de Engenharia</h2>
        <p className="text-white/40 text-[10px] tracking-widest uppercase">Análise em tempo real do sistema Floory</p>
      </header>

      <GlassCard className="aspect-video p-0 flex items-center justify-center overflow-hidden border-emerald-400/20 bg-emerald-500/5 relative">
        <div className="absolute inset-0 xray-mesh opacity-20" />
        <div className="laser-scan" />
        
        <div className="relative text-center z-10">
          <motion.div 
            animate={{ 
              rotateY: [0, 180, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Activity className="w-10 h-10 text-emerald-400/50" />
          </motion.div>
          <p className="text-[8px] text-emerald-400 uppercase tracking-[0.3em] mt-4 font-bold">Scanning Airflow Dynamics...</p>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {[
          { label: 'Massa Adicional de Tinta', value: '+42,4 kg' },
          { label: 'Arrasto Aerodinâmico', value: '-1,2% (Otimizada)' },
          { label: 'Certificação Estrutural', value: 'ANAC-145' },
        ].map((data, i) => (
          <div key={i} className="flex justify-between items-center border-b border-white/5 py-2 px-1">
            <span className="text-[10px] font-medium opacity-60 uppercase tracking-wider">{data.label}</span>
            {dataLoading ? (
              <div className="h-4 w-20 rounded skeleton-shimmer bg-white/5" />
            ) : (
              <motion.span 
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-mono font-bold text-emerald-400"
              >
                {data.value}
              </motion.span>
            )}
          </div>
        ))}
      </div>

      <div className="liquid-glass p-4 bg-purple-500/5 border-purple-500/20 mt-4 relative">
        {dataLoading && <div className="absolute inset-0 skeleton-shimmer z-10 rounded-[24px]" />}
        <p className="text-[9px] uppercase tracking-tighter opacity-50 mb-2 font-bold">Relatório Gemini 3.1 Pro</p>
        <p className="text-[11px] leading-relaxed italic text-purple-200">
          "Redução de arrasto detectada em bueis e Sharklets. A massa adicional está dentro dos parâmetros de aeronavegabilidade para o modelo Global 6000."
        </p>
      </div>
    </motion.div>
  );
};

const LegalScreen = ({ onOpenDoc }: { onOpenDoc: (n: string) => void }) => (
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
          className="w-full liquid-glass flex items-center justify-between px-4 py-3 border-white/5 active:scale-95 transition-all group"
        >
          <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">{doc}</span>
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

const BottomNav = ({ current, onChange }: { current: Screen, onChange: (s: Screen) => void }) => {
  const items = [
    { id: Screen.HOME, icon: Home, label: 'Painel' },
    { id: Screen.REPORT, icon: Activity, label: 'Tech' },
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
