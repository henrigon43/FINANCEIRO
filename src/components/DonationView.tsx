import React, { useState } from 'react';
import { Heart, Copy, Check, QrCode, ShieldCheck, Sparkles, Smartphone, Gift, ExternalLink } from 'lucide-react';

export const DonationView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  
  // Pix code extracted or representation
  const pixKey = "00020126580014br.gov.bcb.pix0136e5ccdb0d-f816-49e6-8a95-54b21c1d1eb55204000053039865802BR5925HENRIQUE GONCALVES6009SAO PAULO62070503***6304";

  const handleCopyPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixKey).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {
        // Fallback copy
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-indigo-50 rounded-2xl border border-rose-100 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 text-xs font-bold mb-3">
            <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
            <span>Apoie o Projeto Finanz</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Contribua e Faça uma Doação
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            O Finanz é mantido com dedicação contínua para oferecer controle financeiro moderno, seguro e sem complicações. Qualquer contribuição via Pix ajuda a manter os servidores ativos e apoiar novas melhorias!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* QR Code Card */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
            <QrCode className="w-5 h-5" />
          </div>
          
          <h3 className="text-base font-bold text-slate-900">
            Pague via QR Code Pix
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Aponte a câmera do aplicativo do seu banco para o QR Code abaixo
          </p>

          {/* QR Code Container */}
          <div className="relative p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm inline-block">
            <img 
              src="/pix_qrcode.png" 
              alt="QR Code Pix Doação" 
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to jpg if png fails
                const target = e.currentTarget;
                if (!target.src.endsWith('pix_qrcode.jpg')) {
                  target.src = '/pix_qrcode.jpg';
                }
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pagamento instantâneo e 100% seguro via Pix</span>
          </div>
        </div>

        {/* Instructions & Pix Copia e Cola */}
        <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
          {/* Pix Copia e Cola Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Pix Copia e Cola</h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Não consegue ler o QR Code pelo celular? Use o botão abaixo para copiar o código Pix:
            </p>

            <div className="relative">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600 break-all select-all pr-24 line-clamp-3">
                {pixKey}
              </div>
              <button
                type="button"
                onClick={handleCopyPix}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Pix</span>
                  </>
                )}
              </button>
            </div>

            {copied && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Código Pix copiado para sua área de transferência!
              </p>
            )}
          </div>

          {/* Passo a Passo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              Como fazer a doação pelo banco:
            </h4>
            
            <ol className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>Abra o app do seu banco no celular (Nubank, Itaú, Inter, Bradesco, etc.).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>Acesse a área <strong>Pix</strong> e selecione <strong>Ler QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>Escaneie a imagem ao lado ou cole o código copiado.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  4
                </span>
                <span>Digite o valor desejado para a contribuição e confirme o envio. Muito obrigado!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Thank you note */}
      <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 text-center">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Gift className="w-4 h-4 text-rose-500" />
          <span>Sua ajuda fortalece o desenvolvimento contínuo de novas funcionalidades e relatórios.</span>
        </p>
      </div>
    </div>
  );
};
