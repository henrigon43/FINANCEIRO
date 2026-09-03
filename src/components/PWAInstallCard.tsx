import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallCard: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowInstructions(prev => !prev);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-xs relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          {/* Real App Icon Preview */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Ícone do Aplicativo Finanz" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 shadow-xs">
              <Smartphone className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Ícone do Aplicativo
              </span>
              {isInstalled && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Instalado
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Salvar como App no Celular
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Ao adicionar o <strong>Finanz</strong> à tela inicial do seu celular, este ícone oficial da prancheta com moeda dourada aparecerá como o aplicativo na tela do seu aparelho.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          {deferredPrompt ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Instalar Aplicativo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowInstructions(prev => !prev)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              {showInstructions ? 'Ocultar Instruções' : 'Como Adicionar na Tela'}
            </button>
          )}
        </div>
      </div>

      {/* Accordion Instructions for Android & iPhone */}
      {showInstructions && (
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in duration-200">
          {/* iPhone / iOS */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
              <Share className="w-4 h-4 text-indigo-600" />
              <span>No iPhone / iPad (Safari):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-normal">
              <li>Abra este site no navegador <strong>Safari</strong> do iPhone.</li>
              <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima).</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              <li>Confirme o nome <strong>Finanz</strong> e clique em <strong>Adicionar</strong>.</li>
            </ol>
          </div>

          {/* Android */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>No Celular Android (Chrome):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-normal">
              <li>Abra este link no navegador <strong>Google Chrome</strong>.</li>
              <li>Toque no menu de <strong>três pontinhos</strong> no topo direito.</li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>O aplicativo será adicionado à sua tela inicial com o novo ícone!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
