import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Coins, 
  Globe, 
  Handshake, 
  QrCode, 
  CreditCard, 
  Barcode, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  DollarSign,
  Copy,
  Check,
  Info,
  Lock,
  UserCheck,
  Calendar
} from 'lucide-react';
import { Contribution } from '../types';

const crc16ccitt = (str: string): string => {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = (crc << 1);
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

const generatePixCopiaECola = (amount: number) => {
  const cnpj = "07824429000142";
  const amountStr = amount.toFixed(2);
  const lenStr = amountStr.length.toString().padStart(2, '0');
  
  // Merchant Account Information (Tag 26)
  const mai = `0014br.gov.bcb.pix0114${cnpj}`;
  const maiTag = `26${mai.length.toString().padStart(2, '0')}${mai}`;
  
  // Transaction Amount (Tag 54)
  const amtTag = `54${lenStr}${amountStr}`;
  
  // Merchant Name (Tag 59)
  const name = "Igreja Presbiteriana de Aquarius";
  const nameTag = `59${name.length.toString().padStart(2, '0')}${name}`;
  
  // Merchant City (Tag 60)
  const city = "Cabo Frio";
  const cityTag = `60${city.length.toString().padStart(2, '0')}${city}`;
  
  const payload = `000201010212${maiTag}520486615303986${amtTag}5802BR${nameTag}${cityTag}62070503***6304`;
  return payload + crc16ccitt(payload);
};

interface DizimosSectionProps {
  contributions: Contribution[];
  userLogged: boolean;
  onAddContribution: (amountVal: number, category: Contribution['category'], method: Contribution['method']) => void;
  onShowAlert: (msg: string) => void;
  onNavigate: (tab: string) => void;
}

export default function DizimosSection({ contributions, userLogged, onAddContribution, onShowAlert, onNavigate }: DizimosSectionProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | 'Outro'>(200);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Contribution['category']>('Oferta');
  const [selectedMethod, setSelectedMethod] = useState<Contribution['method']>('Pix');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceKeyGenerated, setInvoiceKeyGenerated] = useState('');
  const [copiedCNPJ, setCopiedCNPJ] = useState(false);
  const [copiedPixCode, setCopiedPixCode] = useState(false);

  // Sits at initially R$ 750 (75%)
  const totalContributedGoal = 1000;
  const currentContributed = contributions.reduce((acc, curr) => acc + curr.amountVal, 250);
  const progressPercent = Math.min(Math.round((currentContributed / totalContributedGoal) * 100), 100);

  const centMap: Record<Contribution['category'], number> = {
      'Dízimo': 0.01,
      'Oferta': 0.02,
      'Missões': 0.03,
      'Obra Social': 0.04,
      'Evento': 0.05
  };

  const getFinalAmountWithCents = () => {
    let base = selectedAmount === 'Outro' ? parseFloat(customAmount || '0') : selectedAmount;
    if (isNaN(base)) base = 0;
    return base + (centMap[selectedDestination] || 0);
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAmount = getFinalAmountWithCents();
    console.log("Final Amount for PIX:", finalAmount);                
    if (finalAmount <= (centMap[selectedDestination] || 0)) {
      onShowAlert("Por favor, informe um valor de contribuição válido.");
      return;
    }

    // Call state update
    onAddContribution(finalAmount, selectedDestination, selectedMethod);

    // If method is Pix, generate dynamic copyable payment code
    if (selectedMethod === 'Pix') {
      const generatedCode = generatePixCopiaECola(finalAmount);
      setInvoiceKeyGenerated(generatedCode);
      setShowInvoiceModal(true);
      if (!userLogged) {
        onShowAlert(`Dízimo/Oferta de R$ ${finalAmount.toFixed(2)} registrado com sucesso como Visitante!`);
      } else {
        onShowAlert(`Agradecemos sua fidelidade! Dízimo/Oferta de R$ ${finalAmount.toFixed(2)} registrado.`);
      }
    } else {
      if (!userLogged) {
        onShowAlert(`Contribuição de R$ ${finalAmount.toFixed(2)} (${selectedDestination}) registrada como Visitante via ${selectedMethod}!`);
      } else {
        onShowAlert(`Contribuição de R$ ${finalAmount.toFixed(2)} (${selectedDestination}) registrada via ${selectedMethod} com sucesso!`);
      }
    }

    // Reset inputs
    setCustomAmount('');
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(invoiceKeyGenerated);
    onShowAlert("Código Copia e Cola do Pix copiado com sucesso!");
  };

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      
      {/* Generosidade Hero Quote */}
      <section className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-[#001b3d] text-xs font-black tracking-widest uppercase">
          Generosidade
        </div>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight leading-tight select-none">
          Honre ao Senhor com seus bens
        </h2>
        <p className="text-slate-500 font-medium text-sm leading-relaxed px-5">
          "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria."
        </p>
      </section>

      {/* Contribution Selection Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-8">
        
        {/* Value List Chips */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest ml-1">
            Valor da Contribuição
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {[50, 100, 200, 'Outro'].map((amt) => {
              const isSelected = selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedAmount(amt as number | 'Outro')}
                  className={`px-5 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-primary text-white shadow-md' 
                      : 'border border-slate-200 hover:border-primary text-slate-600 hover:text-primary'
                  }`}
                >
                  {typeof amt === 'number' ? `R$ ${amt}` : 'Outro'}
                </button>
              );
            })}
          </div>

          {/* Custom value input */}
          {selectedAmount === 'Outro' && (
            <div className="relative pt-2 animate-fade-in">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <span className="font-extrabold text-sm">R$</span>
              </div>
              <input 
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl py-3.5 pl-10 pr-4 text-sm text-[#191c1d] focus:ring-2 focus:ring-primary transition-all outline-none"
                placeholder="0,00"
              />
            </div>
          )}
        </div>

        {/* Destinação Choice (Bento Grid Squares) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest ml-1">
            Destinação
          </h3>
          <div className="grid grid-cols-2 gap-3 select-none">
            {[
              { cat: 'Dízimo' as typeof selectedDestination, label: 'Dízimo', icon: Coins },
              { cat: 'Oferta' as typeof selectedDestination, label: 'Oferta', icon: HeartHandshake },
              { cat: 'Missões' as typeof selectedDestination, label: 'Missões', icon: Globe },
              { cat: 'Obra Social' as typeof selectedDestination, label: 'Obra Social', icon: Handshake },
              { cat: 'Evento' as typeof selectedDestination, label: 'Evento', icon: Calendar },
            ].map((destination) => {
              const isSelected = selectedDestination === destination.cat;
              const IconComp = destination.icon;

              return (
                <button
                  key={destination.cat}
                  type="button"
                  onClick={() => setSelectedDestination(destination.cat)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left cursor-pointer group ${
                    isSelected 
                      ? 'bg-surface-container-low border-primary text-primary font-black' 
                      : 'bg-surface-container-low border-transparent hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <IconComp className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold">{destination.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest ml-1">
            Forma de Pagamento
          </h3>
          <div className="space-y-2.5">
            {[
              { method: 'Pix' as typeof selectedMethod, label: 'Pix', desc: 'Confirmação instantânea rápida', icon: QrCode },
            ].map((payment) => {
              const isSelected = selectedMethod === payment.method;
              const IconComp = payment.icon;

              return (
                <label 
                  key={payment.method}
                  onClick={() => setSelectedMethod(payment.method)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:bg-[#f3f4f5] transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <IconComp className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-primary leading-tight">{payment.label}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{payment.desc}</p>
                    </div>
                  </div>
                  <input 
                    name="payment_method"
                    type="radio"
                    checked={isSelected}
                    onChange={() => {}} // Controlled via label click
                    className="w-4 h-4 text-primary focus:ring-primary border-slate-300 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Interactive Pix QR and Church Details Card on selection */}
        {selectedMethod === 'Pix' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#001939]/5 text-primary">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black text-primary uppercase tracking-wider">Pix Oficial da Igreja</h4>
                <p className="text-[11px] text-slate-550 font-bold leading-relaxed mt-0.5">
                  Realize sua transferência escaneando o QR Code abaixo ou copiando os dados oficiais.
                </p>
              </div>
            </div>

            {/* Split Design */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              
              {/* Church bank details */}
              <div className="space-y-3 w-full text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Favorecido</span>
                  <span className="text-xs font-black text-[#191c1d] leading-tight block">
                    Igreja Presbiteriana de Aquarius ( Cabo Frio - RJ )
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Chave Pix (CNPJ)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                      07.824.429/0001-42
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("07.824.429/0001-42");
                        onShowAlert("CNPJ copiado! Chave registrada na Igreja Presbiteriana de Aquarius.");
                        setCopiedCNPJ(true);
                        setTimeout(() => setCopiedCNPJ(false), 2000);
                      }}
                      className="text-primary hover:text-indigo-900 p-1.5 rounded hover:bg-slate-100 cursor-pointer shrink-0 transition-colors"
                      title="Copiar CNPJ"
                    >
                      {copiedCNPJ ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100 font-medium">
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Valor Estimado</span>
                    <span className="font-sans font-black text-xs text-primary">R$ {getFinalAmountWithCents().toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Finalidade</span>
                    <span className="font-sans font-black text-[10px] text-slate-600 block bg-slate-100 px-1.5 py-0.5 rounded uppercase">{selectedDestination}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pix copy paste */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Chave Pix Copia e Cola</span>
              <div className="bg-white px-3 py-2.5 rounded-lg flex items-center justify-between text-left border border-slate-200 shadow-xs">
                <p className="text-[10px] text-slate-500 font-mono select-all truncate max-w-[190px] sm:max-w-[280px] font-medium animate-fade-in" key={getFinalAmountWithCents()}>
                  {generatePixCopiaECola(getFinalAmountWithCents())}
                </p>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatePixCopiaECola(getFinalAmountWithCents()));
                    onShowAlert("Código Copia e Cola do Pix copiado com sucesso!");
                    setCopiedPixCode(true);
                    setTimeout(() => setCopiedPixCode(false), 2000);
                  }}
                  className="text-[9px] text-primary font-black uppercase tracking-wider px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded shadow-xs hover:bg-slate-100 shrink-0 cursor-pointer flex items-center gap-1"
                >
                  {copiedPixCode ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPixCode ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {!userLogged && (
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-3 flex gap-2 text-left">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-905 leading-normal font-bold">
                  Você não está autenticado. Para que essa contribuição seja associada à sua Ficha Cadastral no painel de membro, faça <button type="button" onClick={() => onNavigate('login')} className="text-primary underline font-black hover:opacity-85 pointer">Login aqui</button>. Caso prefira continuar sem identificar-se, sua contribuição dízimo/oferta será registrada como Visitante.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contribute Button */}
        <button
          onClick={handleContribute}
          className="w-full primary-gradient text-[#d6e3ff] hover:text-white py-4.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer pt-3 pb-3"
        >
          <Coins className="w-4 h-4" />
          <span>Contribuir Agora</span>
        </button>
      </section>

      {/* Minhas Contribuições List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <h3 className="text-lg font-bold text-primary">Minhas Contribuições</h3>
          <span className="text-xs text-slate-500 font-bold inline-block">Histórico</span>
        </div>

        <div className="space-y-3">
          {contributions.map((cont) => (
            <div 
              key={cont.id} 
              className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {cont.category === 'Dízimo' ? (
                    <Coins className="w-5 h-5 text-primary" />
                  ) : (
                    <HeartHandshake className="w-5 h-[#ba1a1a]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary leading-tight">{cont.title}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{cont.date}</p>
                </div>
              </div>
              <p className="font-sans font-extrabold text-sm text-primary">
                R$ {cont.amountVal.toFixed(2)}
              </p>
            </div>
          ))}

          {/* Bento Style Card for Pledges */}
          <div className="relative overflow-hidden bg-[#001939] rounded-2xl p-6 text-white shadow-lg space-y-4 select-none">
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] font-bold text-[#a9c7ff] uppercase tracking-widest block">
                Compromisso Missionário
              </span>
              <h4 className="text-lg font-bold text-white leading-tight">Adote um Missionário</h4>
              
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-[#a9c7ff] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>

              <div className="flex justify-between text-[11px] font-bold text-slate-300">
                <span>R$ {currentContributed} de R$ {totalContributedGoal}</span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            {/* Decorative background public map icon */}
            <Globe className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Pix Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-[#001939]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-primary flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-650" />
                <span>Pix Gerado Oficial</span>
              </h3>
              <button 
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-primary font-bold text-sm cursor-pointer p-1"
              >
                Fechar
              </button>
            </div>

            {/* Bank details and church header */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3 text-left">
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Favorecido / Beneficiário</span>
                <span className="text-xs font-black text-[#191c1d] leading-snug block">Igreja Presbiteriana de Aquarius ( Cabo Frio - RJ )</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Chave Pix CNPJ</span>
                  <span className="font-mono text-[10px] font-bold text-primary block">07.824.429/0001-42</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Valor do Repasse</span>
                  <span className="font-sans font-black text-xs text-green-650 block">R$ {getFinalAmountWithCents().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#43474f] font-bold leading-normal px-4">
              Copie a linha digitável simplificada Copia e Cola abaixo para efetuar a transferência.
            </p>

            <div className="bg-[#f3f4f5] p-2.5 rounded-lg flex items-center justify-between text-left border border-slate-200">
              <p className="text-[10px] text-slate-500 font-mono select-all truncate max-w-[240px] font-semibold">
                {invoiceKeyGenerated}
              </p>
              <button 
                onClick={copyPixCode}
                className="text-[10px] text-primary font-black uppercase tracking-wider px-3 py-1.5 bg-white rounded shadow-xs hover:bg-slate-100 shrink-0 cursor-pointer border border-slate-200"
              >
                Copiar
              </button>
            </div>
            
            <p className="text-[10px] text-emerald-650 font-black bg-emerald-50 border border-emerald-100 py-2.5 rounded-full inline-block px-6">
               ✓ Pix Ativo • Processando recebimento...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
