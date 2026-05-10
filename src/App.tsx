/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { 
  Network, 
  Info, 
  Binary, 
  Calculator, 
  Trophy, 
  RefreshCcw, 
  ArrowRightLeft,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types & Constants ---

interface SubnetResults {
  networkId: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  maskDecimal: string;
  binaryOctets: string[][];
}

const DEFAULT_IP = "192.168.1.10";
const DEFAULT_MASK = 24;

// --- Helper Functions ---

const ipToInt = (ip: string): number => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

const intToIp = (num: number): string => {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF
  ].join('.');
};

const getBinaryOctets = (num: number): string[] => {
  const binary = num.toString(2).padStart(32, '0');
  return [
    binary.slice(0, 8),
    binary.slice(8, 16),
    binary.slice(16, 24),
    binary.slice(24, 32)
  ];
};

export default function App() {
  const [ipInput, setIpInput] = useState(DEFAULT_IP);
  const [maskInput, setMaskInput] = useState(DEFAULT_MASK);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challenge, setChallenge] = useState<{ targetHosts: number; correctMask: number } | null>(null);
  const [challengeGuess, setChallengeGuess] = useState("");
  const [challengeResult, setChallengeResult] = useState<"correct" | "wrong" | null>(null);

  // --- Network Logic ---

  const results = useMemo((): SubnetResults | null => {
    try {
      const octets = ipInput.split('.');
      if (octets.length !== 4) return null;
      if (octets.some(o => isNaN(parseInt(o)) || parseInt(o) < 0 || parseInt(o) > 255)) return null;

      const ipValue = ipToInt(ipInput);
      const maskValue = (0xFFFFFFFF << (32 - maskInput)) >>> 0;
      
      const networkIdInt = (ipValue & maskValue) >>> 0;
      const broadcastInt = (networkIdInt | (~maskValue)) >>> 0;
      const totalHosts = Math.max(0, Math.pow(2, 32 - maskInput) - 2);

      return {
        networkId: intToIp(networkIdInt),
        broadcast: intToIp(broadcastInt),
        firstHost: totalHosts > 0 ? intToIp(networkIdInt + 1) : "N/A",
        lastHost: totalHosts > 0 ? intToIp(broadcastInt - 1) : "N/A",
        totalHosts,
        maskDecimal: intToIp(maskValue),
        binaryOctets: getBinaryOctets(ipValue).map(octet => octet.split(''))
      };
    } catch (e) {
      return null;
    }
  }, [ipInput, maskInput]);

  // --- Challenge Mode Logic ---

  const generateChallenge = () => {
    // We limit challenges to mask /24 to /30 as per user request scope
    const masks = [24, 25, 26, 27, 28, 29, 30];
    const randomMask = masks[Math.floor(Math.random() * masks.length)];
    const hosts = Math.pow(2, 32 - randomMask) - 2;
    
    setChallenge({ targetHosts: hosts, correctMask: randomMask });
    setChallengeGuess("");
    setChallengeResult(null);
    setShowChallenge(true);
  };

  const checkChallenge = () => {
    if (parseInt(challengeGuess) === challenge?.correctMask) {
      setChallengeResult("correct");
    } else {
      setChallengeResult("wrong");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-cyan-900/30 -z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="px-6 md:px-8 pt-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Network className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                SubnetViz <span className="text-blue-400">Pro</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Calculadora Educativa de Redes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
              Status: <span className="text-green-400">Activo</span>
            </div>
            <button 
              onClick={generateChallenge}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-900/40 active:scale-95"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              ¡Reto Alumno!
            </button>
          </div>
        </header>

        {/* Main Interface */}
        <main className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs section */}
          <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
            <section id="inputs" className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl space-y-5">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                Configuración de Red
              </h2>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dirección IP (IPv4)</label>
                <input 
                  type="text" 
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="Ej: 192.168.1.10"
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Máscara de Subred (CIDR)</label>
                <div className="relative">
                  <select 
                    value={maskInput}
                    onChange={(e) => setMaskInput(parseInt(e.target.value))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {[24, 25, 26, 27, 28, 29, 30].map(m => (
                      <option key={m} value={m} className="bg-slate-800 text-white">/{m} ({Math.pow(2, 32-m) - 2} hosts)</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ArrowRightLeft className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {!results && (
                <div className="flex items-center gap-2 text-red-400 text-xs font-medium px-2">
                  <AlertCircle className="w-4 h-4" />
                  Formato de IP inválido
                </div>
              )}
            </section>

            {/* Logical Explanation Card (Educational Pill) */}
            <section className="backdrop-blur-xl bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden flex-1">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
              <h4 className="text-orange-300 text-[10px] font-bold uppercase tracking-widest mb-3 italic">Píldora Educativa</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Restamos <span className="text-orange-400 font-bold">2</span> porque la primera identifica la <span className="italic text-orange-200/80">Red</span> (ID) y la última es el canal de <span className="italic text-orange-200/80">Broadcast</span> para todos. Ambas están reservadas.
              </p>
              <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5 space-y-2">
                 <span className="text-[10px] text-orange-200/40 uppercase block font-bold tracking-widest">Tip del profesor</span>
                 <span className="text-xs text-orange-100/90 italic block leading-snug">"Sin ID no hay casa, sin Broadcast no hay radio. ¡Recuérdalo en el examen!"</span>
              </div>
            </section>
          </div>

          {/* Results section */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Binary Visualization */}
            <section className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Binary className="w-4 h-4 text-indigo-400" />
                  Desglose Binario de Octetos
                </h2>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> Red</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-600 rounded-sm" /> Host</span>
                </div>
              </div>

              <div className="space-y-8">
                {results ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {results.binaryOctets.map((bits, octetIdx) => (
                      <div key={octetIdx} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3 group hover:border-white/10 transition-colors">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
                          <span>OCTETO {octetIdx + 1}</span>
                          <span className="text-blue-300 font-bold">{ipInput.split('.')[octetIdx]}</span>
                        </div>
                        <div className="grid grid-cols-8 gap-0.5 md:gap-1">
                          {bits.map((bit, bitIdx) => {
                            const absoluteIdx = (octetIdx * 8) + bitIdx;
                            const isNetwork = absoluteIdx < maskInput;
                            return (
                              <motion.div
                                key={bitIdx}
                                initial={false}
                                animate={{ 
                                  backgroundColor: isNetwork ? "#3b82f6" : "#475569",
                                  opacity: isNetwork ? 1 : 0.4,
                                  scale: isNetwork ? 1 : 0.95
                                }}
                                className={`aspect-square flex items-center justify-center rounded-sm font-mono font-bold text-white text-[10px] shadow-sm ${isNetwork ? 'shadow-blue-500/20' : ''}`}
                              >
                                {bit}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center border border-white/10 bg-slate-800/30 rounded-2xl text-slate-500 italic gap-3">
                    <div className="p-3 bg-slate-700/50 rounded-full">
                       <Calculator className="w-6 h-6 text-slate-500" />
                    </div>
                    Introduce una dirección válida para procesar...
                  </div>
                )}
              </div>
            </section>

            {/* Detailed Analysis Cards */}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Network Analysis */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
                >
                  <h4 className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-4 italic text-right">Análisis de Red</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400 text-sm">Network ID</span>
                      <span className="font-mono text-white text-md font-bold">{results.networkId}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400 text-sm">Broadcast IP</span>
                      <span className="font-mono text-white text-md font-bold">{results.broadcast}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400 text-sm">Rango de Hosts</span>
                      <span className="font-mono text-blue-300 text-sm">{results.firstHost} a {results.lastHost}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-300 font-bold text-sm">Hosts Totales</span>
                      <div className="text-right">
                        <span className="block text-3xl font-bold text-blue-400 leading-none">{results.totalHosts}</span>
                        <span className="text-[9px] text-blue-300 font-mono uppercase tracking-tighter">fórmula: 2^{32-maskInput} - 2</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Subnet Mask Info */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="backdrop-blur-xl bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6 flex flex-col justify-between"
                >
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-cyan-400 rounded-lg text-slate-900">
                        <Network className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Máscara CIDR</h4>
                        <p className="text-[10px] text-cyan-200 uppercase tracking-tighter font-semibold">Configuración Activa</p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block mb-1 font-bold tracking-widest">Máscara Decimal</span>
                        <span className="text-xl font-mono text-cyan-400 font-bold tracking-tighter">{results.maskDecimal}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-400 text-xs font-medium">Equivale a una máscara de /{maskInput} bits</span>
                      </div>
                   </div>
                </motion.div>
              </div>
            )}
          </div>
        </main>

        {/* Challenge Modal Layer */}
        <AnimatePresence>
          {showChallenge && challenge && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-lg p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="backdrop-blur-2xl bg-slate-900/40 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(30,58,138,0.25)] space-y-8 relative overflow-hidden"
              >
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                
                <div className="flex justify-between items-start">
                  <div className="bg-indigo-500/20 border border-indigo-500/30 p-3 rounded-2xl shadow-inner">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                  <button 
                    onClick={() => setShowChallenge(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 group"
                  >
                    <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Reto de Ingeniería</h3>
                  <div className="bg-black/30 rounded-xl p-5 border border-white/5 text-center space-y-4">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block mb-1 tracking-widest font-bold">Objetivo de Host</span>
                      <span className="text-2xl font-mono text-yellow-400 tracking-tighter block font-bold">
                        {challenge.targetHosts} Hosts Utilizables
                      </span>
                    </div>
                    <div className="py-3 px-4 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-sm text-slate-300 leading-snug">¿Qué máscara CIDR necesitas para cubrir estos hosts?</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xl">/</span>
                     <input 
                       type="number"
                       value={challengeGuess}
                       onChange={(e) => setChallengeGuess(e.target.value)}
                       className="w-full pl-8 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-2xl text-white shadow-inner"
                       placeholder="24"
                     />
                  </div>
                  <button 
                    onClick={checkChallenge}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 group"
                  >
                    Verificar Respuesta
                    <ArrowRightLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {challengeResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl flex items-center gap-3 font-medium text-sm ${
                      challengeResult === "correct" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {challengeResult === "correct" ? (
                      <>
                        <Trophy className="w-4 h-4 text-emerald-300" />
                        ¡Magistral! Has dominado el robo de bits.
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-300" />
                        Incorrecto. Tip: 2^(32-n) - 2 ≥ Objetivo
                      </>
                    )}
                  </motion.div>
                )}
                
                <button 
                  onClick={() => setShowChallenge(false)}
                  className="w-full text-center text-slate-500 text-xs hover:text-slate-300 font-medium transition-colors"
                >
                  Regresar al Laboratorio
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Footer */}
        <footer className="px-8 py-4 bg-black/20 text-[10px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-800 rounded text-slate-400 font-bold uppercase tracking-tighter">RFC 791</span>
             <span>Laboratorio de Telecomunicaciones - Visual Subnet v1.0</span>
          </div>
          <div className="flex gap-6 uppercase tracking-widest font-bold">
            <span className="hover:text-blue-400 transition-colors cursor-default">IPv4 Protocol</span>
            <span className="hover:text-blue-400 transition-colors cursor-default">CIDR Standard</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
