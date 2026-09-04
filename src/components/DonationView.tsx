import React, { useState, useEffect } from 'react';
import { Heart, Copy, Check, QrCode, ShieldCheck, Sparkles, Smartphone, Gift, Key } from 'lucide-react';
import QRCode from 'qrcode';

export const DonationView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Chave Pix fornecida pelo usuário
  const pixKey = "c1e42a9a-cb82-4705-9ba6-0a6e89881a1f";
  
  // Código Pix Copia e Cola oficial sem valor pré-fixado (qualquer valor é aceito no app do banco)
  const pixCopiaECola = "00020126580014br.gov.bcb.pix0136c1e42a9a-cb82-4705-9ba6-0a6e89881a1f5204000053039865802BR5918HENRIQUE GONCALVES6009SAO PAULO62070503***63043E26";

  useEffect(() => {
    // Gera o QR code exato e nítido a partir do Pix Copia e Cola
    QRCode.toDataURL(pixCopiaECola, {
      width: 480,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    }).then((url) => {
      setQrCodeDataUrl(url);
    }).catch(() => {
      // Fallback para arquivo gerado
      setQrCodeDataUrl('/pix_qrcode.svg');
    });
  }, [pixCopiaECola]);

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixCopiaECola).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      }).catch(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      });
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleCopyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixKey).then(() => {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 3000);
      }).catch(() => {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 3000);
      });
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
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
            Qualquer valor é aceito e muito bem-vindo! Você escolhe o valor diretamente no aplicativo do seu banco ao escanear o QR Code ou utilizar a chave Pix abaixo.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sem valor fixo: digite a quantia que desejar no seu app bancário
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* QR Code Card */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
            <QrCode className="w-5 h-5" />
          </div>
          
          <h3 className="text-base font-bold text-slate-900">
            QR Code Pix Oficial
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Abra o app do seu banco e aponte a câmera para o QR Code abaixo
          </p>

          {/* QR Code Container */}
          <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm inline-block">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code Pix Doação" 
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img 
                src="/pix_qrcode.svg" 
                alt="QR Code Pix Doação" 
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = '/pix_qrcode.png';
                }}
              />
            )}
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pagamento instantâneo via Pix • Qualquer valor</span>
          </div>
        </div>

        {/* Chave Pix e Pix Copia e Cola */}
        <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
          {/* Chave Pix Direta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <Key className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Chave Pix (Chave Aleatória)</h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Caso prefira transferir usando a chave Pix diretamente:
            </p>

            <div className="relative">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-700 break-all select-all pr-24">
                {pixKey}
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  copiedKey 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pix Copia e Cola Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Pix Copia e Cola</h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Código completo para a opção "Pix Copia e Cola" do seu banco:
            </p>

            <div className="relative">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600 break-all select-all pr-24 line-clamp-3">
                {pixCopiaECola}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  copiedCode 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            {copiedCode && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Código Pix Copia e Cola copiado para sua área de transferência!
              </p>
            )}
          </div>

          {/* Passo a Passo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              Como fazer a doação pelo seu banco:
            </h4>
            
            <ol className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>Abra o app do seu banco no celular e acesse a área <strong>Pix</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>Escolha <strong>Ler QR Code</strong>, <strong>Pix Copia e Cola</strong> ou <strong>Transferir com Chave</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span><strong>Digite o valor que deseja doar</strong> (qualquer quantia é aceita) e confirme o envio!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Thank you note */}
      <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 text-center">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Gift className="w-4 h-4 text-rose-500" />
          <span>Muito obrigado pelo apoio e por incentivar o desenvolvimento contínuo da plataforma!</span>
        </p>
      </div>
    </div>
  );
};
