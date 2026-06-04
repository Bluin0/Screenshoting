import React, { useRef, useState, useEffect } from 'react';
import {
  Monitor,
  Cpu,
  Upload,
  Keyboard,
  Settings,
  HelpCircle,
  FileCode,
  Sparkles,
  Clipboard,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { drawCachyOSDesktop } from '../utils/desktopSim';

interface LandingPageProps {
  onImageCaptured: (dataUrl: string) => void;
  screenshotX: number;
  setScreenshotX: React.Dispatch<React.SetStateAction<number>>;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onImageCaptured,
  screenshotX,
  setScreenshotX
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time ticker for mock desktop visualization
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(
        now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Set up Print Screen global keyboard capture!
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Listen for PrintScreen or standard testing keys 'p' or Space when not inside input elements
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'PrintScreen' || e.key === 'q' || e.key === 'p') {
        e.preventDefault();
        captureSimulatedCachyOS();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                onImageCaptured(event.target.result as string);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImageCaptured]);

  // Method 1: Real screen/display capture via HTML5 MediaDevices
  const captureRealScreen = async () => {
    setErrorMessage(null);
    try {
      // Standard Display Capture API
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor'
        },
        audio: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.style.display = 'none';
      document.body.appendChild(video);

      video.onloadedmetadata = async () => {
        try {
          await video.play();

          // Draw video element directly to high-res canvas slice
          const canvas = document.createElement('canvas');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const screenshotUrl = canvas.toDataURL('image/png');
            
            // Cleanup stream capture
            stream.getTracks().forEach((track) => track.stop());
            document.body.removeChild(video);
            
            onImageCaptured(screenshotUrl);
          }
        } catch (err) {
          console.error('Error drawing frame:', err);
          setErrorMessage('No se pudo procesar la animación del monitor en tiempo real.');
        }
      };
    } catch (err: any) {
      console.warn('Real screen capture failed or cancelled:', err);
      // Give beautiful desktop feedback or fallback message
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Permiso denegado o cancelado. ¡Prueba la simulación de CachyOS debajo para probar!');
      } else {
        setErrorMessage('El navegador bloqueó la captura nativa en este iframe. ¡Usa la simulación de CachyOS debajo!');
      }
    }
  };

  // Method 2: High-fidelity simulated desktop generate
  const captureSimulatedCachyOS = () => {
    setErrorMessage(null);
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      drawCachyOSDesktop(ctx, canvas.width, canvas.height, currentTime, currentDate);
      const screenshotUrl = canvas.toDataURL('image/png');
      onImageCaptured(screenshotUrl);
    }
  };

  // Drag and drop local image fallback handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Por favor, ingresa únicamente archivos de imagen (PNG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageCaptured(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b26] text-zinc-100 flex flex-col justify-between font-sans selection:bg-blue-500/30 selection:text-blue-300 relative overflow-hidden">
      
      {/* Absolute clean minimalist dark decoration background spots */}
      <div className="absolute top-0 right-0 w-[50vh] h-[50vh] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[40vh] h-[40vh] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative desktop previews floating behind with clean outline */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none hidden lg:block">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[75%] rounded-2xl border border-white/5 bg-[#24283b]/20 shadow-inner overflow-hidden p-3 scale-95 origin-center">
          <div className="w-full h-full border border-white/5 rounded-xl relative">
            <div className="absolute top-4 left-4 w-40 h-20 bg-[#24283b] border border-white/5 rounded p-1"/>
            <div className="absolute top-4 right-4 w-44 h-32 bg-[#24283b] border border-white/10 rounded p-1"/>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 h-10 bg-[#24283b] border border-white/5 rounded-full"/>
          </div>
        </div>
      </div>

      {/* HEADER SECTION */}
      <header className="px-6 py-5 relative z-10 max-w-7xl mx-auto w-full flex justify-between items-center border-b border-white/10 bg-[#24283b]/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-black/40 border border-white/10">
            <Sparkles className="text-white shrink-0" size={19} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Lightshot para CachyOS <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/25">v2.1</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium">Clon idéntico de escritorio para navegadores modernos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-zinc-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg transition border border-white/10 cursor-pointer"
            title="Mostrar Guía de Teclas"
          >
            <HelpCircle size={17} />
          </button>
        </div>
      </header>

      {/* MAIN LAUNCHER CONTROL PANEL */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6 relative z-10 max-w-4xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#24283b] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative">
          
          {/* Accent decoration line */}
          <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />

          {/* Left panel: Actions */}
          <div className="md:col-span-7 space-y-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold mb-3 font-mono">
                ● LISTO PARA CONGELAR
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Tus capturas de pantalla, ahora con un clic.
              </h2>
              <p className="text-zinc-300 text-sm mt-2 leading-relaxed font-normal">
                Congela la pantalla en el acto, selecciona el área exacta que buscas recortar y añade líneas, flechas o textos de forma idéntica a Lightshot.
              </p>
            </div>

            {/* ERROR LIGHTBANNER */}
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-xs text-red-200 rounded-lg flex items-start gap-2 animate-pulse">
                <span className="font-bold text-red-400 uppercase shrink-0">Aviso:</span>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* ACTION TRIGGERS IN BULLET GRID */}
            <div className="space-y-3.5 pt-2">
              {/* Capture Real PC Screen Button */}
              <button
                onClick={captureRealScreen}
                className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 rounded-xl group transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-blue-600/10 group-hover:text-blue-400 text-zinc-300 flex items-center justify-center border border-white/10 transition">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition">
                      Capturar Pantalla Real
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Captura cualquier pestaña o monitor conectado</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-blue-500 text-zinc-400 group-hover:text-white border border-white/10 flex items-center justify-center transition">
                  <Maximize2 size={12} strokeWidth={2.5} />
                </div>
              </button>

              {/* Simulated CachyOS Desktop Screen Capture Button */}
              <button
                onClick={captureSimulatedCachyOS}
                className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/45 border border-white/5 hover:border-white/25 rounded-xl group transition cursor-pointer text-left focus:ring-1 focus:ring-blue-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-blue-600/10 group-hover:text-blue-400 text-zinc-300 flex items-center justify-center border border-white/10 transition">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition flex items-center gap-1.5">
                      Capturar Escritorio Simulado
                      <span className="text-[9px] bg-blue-400/10 text-blue-300 font-mono font-normal px-1.5 py-0.2 rounded border border-blue-400/20">CachyOS</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Ideal para probar de forma inmediata y sin permisos</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded bg-[#2d2d2d] text-[10px] font-mono font-bold text-zinc-400 group-hover:text-blue-300 border border-white/5 transition animate-pulse">
                  Espacio / P
                </div>
              </button>
            </div>

            {/* Custom file index configuration */}
            <div className="bg-black/10 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 gap-y-1 flex-wrap">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-sans">
                <Settings size={14} className="text-zinc-400" />
                Nombre del archivo guardado:
              </span>
              <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-white/10">
                <span className="text-xs text-zinc-400 font-mono">Screenshot_</span>
                <input
                  type="number"
                  value={screenshotX}
                  onChange={(e) => setScreenshotX(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center bg-[#24283b] text-blue-300 font-bold font-mono text-xs rounded border border-white/10 px-1 py-0.5 focus:outline-none focus:border-blue-500"
                  min="1"
                />
                <span className="text-xs text-zinc-400 font-mono">.png</span>
              </div>
            </div>

          </div>

          {/* Right panel: File Drag & Clipboard fallback */}
          <div className="md:col-span-5 flex flex-col gap-4">
            
            {/* Drag & Drop File Loader UI */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/5 text-blue-300'
                  : 'border-white/10 hover:border-white/20 bg-black/10 hover:bg-black/20 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#1a1b26] flex items-center justify-center border border-white/10 shadow shadow-black">
                <Upload size={20} className={isDragging ? "text-blue-300" : "text-zinc-400"} />
              </div>
              <div>
                <span className="text-sm font-bold block text-white">Sube una imagen</span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Arrastra tu fondo o pulsa aquí para buscar</span>
              </div>
            </div>

            {/* Direct Paste Clipboard Panel */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center border border-white/10 text-zinc-400">
                <Clipboard size={16} />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-white block">Pegado rápido (Clipboard)</span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block leading-relaxed">
                  Pulsa <kbd className="bg-[#24283b] border border-white/10 px-1 py-0.2 rounded font-mono">Ctrl+V</kbd> en cualquier sitio para pegar una captura del portapapeles.
                </span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* FLOATING DETAILED SHORTCUT HELP PANELS */}
      {(showHelp || true) && (
        <section className={`px-6 py-4 max-w-4xl mx-auto w-full transition-all duration-300 ${showHelp ? 'opacity-100' : 'opacity-75'}`}>
          <div className="bg-[#24283b]/60 border border-white/10 rounded-xl p-4 md:px-6">
            <h4 className="text-xs font-bold tracking-widest text-blue-400 uppercase flex items-center gap-2 mb-3">
              <Keyboard size={14} />
              Atajos de Teclado y Controles Clave
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-black/10 p-2 rounded">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#1a1b26]/40 border border-white/10">
                <kbd className="px-1.5 py-0.5 bg-black/40 text-[10px] font-mono border border-white/10 text-blue-300 rounded">Impr Pant / P</kbd>
                <span className="text-[11px] text-zinc-300">Congelar e iniciar</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#1a1b26]/40 border border-white/10">
                <kbd className="px-1.5 py-0.5 bg-black/40 text-[10px] font-mono border border-white/10 text-zinc-300 rounded">Esc</kbd>
                <span className="text-[11px] text-zinc-300">Descartar / Salir</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#1a1b26]/40 border border-white/10">
                <kbd className="px-1.5 py-0.5 bg-black/40 text-[10px] font-mono border border-white/10 text-zinc-300 rounded">Ctrl + C</kbd>
                <span className="text-[11px] text-zinc-300">Copiar directamente</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#1a1b26]/40 border border-white/10">
                <kbd className="px-1.5 py-0.5 bg-black/40 text-[10px] font-mono border border-white/10 text-zinc-300 rounded">Ctrl + S</kbd>
                <span className="text-[11px] text-zinc-300">Guardar archivo</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER STATS */}
      <footer className="px-6 py-4 max-w-7xl mx-auto w-full text-center text-[11px] text-zinc-400 font-medium border-t border-white/10">
        Diseñado con profunda fidelidad para <span className="hover:text-blue-400 transition cursor-help">CachyOS Linux</span>. Guarda archivos locales sin servidores externos.
      </footer>
    </div>
  );
};
