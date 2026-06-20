"use client"

import React, { useState, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { 
  Download, FileSpreadsheet, Gamepad2, UploadCloud, 
  Sparkles, TrendingUp, AlertCircle, FileImage, 
  Trophy, Crosshair, Shield, Zap
} from 'lucide-react';

// --- MOCK DATA ---
const monthlyTrendData = [
  { name: 'Jan', revenue: 4000, cost: 2400 },
  { name: 'Feb', revenue: 3000, cost: 1398 },
  { name: 'Mar', revenue: 2000, cost: 9800 },
  { name: 'Apr', revenue: 2780, cost: 3908 },
  { name: 'May', revenue: 1890, cost: 4800 },
  { name: 'Jun', revenue: 2390, cost: 3800 },
];

const growthData = [
  { name: 'Q1', users: 1000, active: 800 },
  { name: 'Q2', users: 2500, active: 1800 },
  { name: 'Q3', users: 5000, active: 3900 },
  { name: 'Q4', users: 8500, active: 7000 },
];

const proportionData = [
  { name: 'Product A', value: 400 },
  { name: 'Product B', value: 300 },
  { name: 'Product C', value: 300 },
  { name: 'Product D', value: 200 },
];
const COLORS = ['#10b981', '#14b8a6', '#6366f1', '#f59e0b']; // emerald, teal, indigo, amber

const playerStatsData = [
  { subject: 'Aim', A: 120, fullMark: 150 },
  { subject: 'Movement', A: 98, fullMark: 150 },
  { subject: 'Utility', A: 86, fullMark: 150 },
  { subject: 'Teamwork', A: 99, fullMark: 150 },
  { subject: 'Clutch', A: 85, fullMark: 150 },
  { subject: 'Eco', A: 65, fullMark: 150 },
];

const kdaData = [
  { name: 'Faker', K: 12, D: 2, A: 8 },
  { name: 'Zeus', K: 8, D: 4, A: 10 },
  { name: 'Oner', K: 5, D: 5, A: 15 },
  { name: 'Gumayusi', K: 14, D: 1, A: 6 },
  { name: 'Keria', K: 2, D: 3, A: 20 },
];

export default function AIInfographicGenerator() {
  const [mode, setMode] = useState<'admin' | 'esports'>('admin');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsProcessing(true);
      setShowResult(false);
      setProgress(0);
      
      // Mock progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            setShowResult(true);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }
  };

  const exportPNG = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Infographic_${mode}_${Date.now()}.png`;
    link.click();
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`Infographic_${mode}_${Date.now()}.pdf`);
  };

  const resetState = () => {
    setFile(null);
    setShowResult(false);
    setProgress(0);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${mode === 'esports' ? 'bg-zinc-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header & Tabs */}
      <header className={`sticky top-0 z-10 backdrop-blur-md border-b ${mode === 'esports' ? 'border-zinc-800 bg-zinc-950/80' : 'border-slate-200 bg-slate-50/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className={`h-6 w-6 ${mode === 'esports' ? 'text-cyan-400' : 'text-indigo-600'}`} />
            <h1 className="text-xl font-bold tracking-tight">AI DashGen</h1>
          </div>
          
          <div className="flex p-1 space-x-1 rounded-xl bg-slate-200/50 dark:bg-zinc-800/50 border border-slate-300/50 dark:border-zinc-700/50">
            <button 
              onClick={() => { setMode('admin'); resetState(); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Admin & Office</span>
            </button>
            <button 
              onClick={() => { setMode('esports'); resetState(); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'esports' ? 'bg-zinc-900 text-cyan-400 shadow-sm ring-1 ring-zinc-700' : 'text-zinc-400 hover:text-zinc-300'}`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Esports & Game</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* State 1: Upload / Dropzone */}
        {!showResult && (
          <div className="max-w-3xl mx-auto mt-8 sm:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`text-center mb-8`}>
              <h2 className={`text-3xl font-extrabold tracking-tight mb-3 ${mode === 'esports' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500' : 'text-slate-900'}`}>
                {mode === 'admin' ? 'Data to Dashboard Generator' : 'Match Vision AI Analyzer'}
              </h2>
              <p className={mode === 'esports' ? 'text-zinc-400' : 'text-slate-500'}>
                {mode === 'admin' ? 'Upload your Spreadsheet (.xlsx, .csv) and let AI uncover the hidden patterns.' : 'Drop a match screenshot (.png, .jpg) and let Vision AI extract player statistics.'}
              </p>
            </div>

            <div className={`relative group rounded-3xl border-2 border-dashed p-10 sm:p-16 transition-all duration-300 hover:scale-[1.01] ${mode === 'esports' ? 'border-zinc-700 hover:border-cyan-500/50 bg-zinc-900/50 hover:bg-zinc-900/80 shadow-[0_0_15px_rgba(34,211,238,0.05)] hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]' : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 hover:shadow-xl hover:shadow-indigo-100'}`}>
              <input 
                type="file" 
                accept={mode === 'admin' ? ".csv, .xlsx" : "image/png, image/jpeg"}
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isProcessing}
              />
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className={`p-5 rounded-full ${mode === 'esports' ? 'bg-zinc-800 text-cyan-400 group-hover:text-cyan-300 group-hover:bg-zinc-800' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:scale-110 transition-transform'}`}>
                  {mode === 'admin' ? <UploadCloud className="h-10 w-10" /> : <FileImage className="h-10 w-10" />}
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    Click or drag and drop to upload
                  </p>
                  <p className={`text-sm mt-1 ${mode === 'esports' ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {mode === 'admin' ? 'Supported formats: XLSX, CSV (Max 10MB)' : 'Supported formats: PNG, JPG (Max 5MB)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Processing State */}
            {isProcessing && (
              <div className="mt-8 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Sparkles className={`h-4 w-4 animate-pulse ${mode === 'esports' ? 'text-cyan-400' : 'text-indigo-600'}`} />
                    <span className={mode === 'esports' ? 'text-zinc-300' : 'text-slate-700'}>
                      {mode === 'admin' 
                        ? 'AI sedang mendeteksi tren dan anomali data...' 
                        : 'Vision AI sedang mengekstrak teks, skor, dan data KDA pemain dari gambar...'}
                    </span>
                  </div>
                  <span>{progress}%</span>
                </div>
                <div className={`h-2.5 w-full rounded-full overflow-hidden ${mode === 'esports' ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-100 ease-out ${mode === 'esports' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State 2: Dashboard Result */}
        {showResult && (
          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'admin' ? 'Business Intelligence Report' : 'Match Performance Analysis'}
                </h2>
                <p className={`text-sm ${mode === 'esports' ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Generated on {new Date().toLocaleDateString()} from {file?.name || 'Uploaded File'}
                </p>
              </div>
              <div className="flex space-x-3 w-full sm:w-auto">
                <button 
                  onClick={exportPNG}
                  className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all ${mode === 'esports' ? 'bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700' : 'bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 shadow-sm'}`}
                >
                  <Download className="h-4 w-4" />
                  <span>Export PNG</span>
                </button>
                <button 
                  onClick={exportPDF}
                  className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-white transition-all shadow-md ${mode === 'esports' ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
                >
                  <Download className="h-4 w-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* THE DASHBOARD CANVAS */}
            <div 
              ref={dashboardRef} 
              className={`p-6 sm:p-8 rounded-3xl ${mode === 'esports' ? 'bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden' : 'bg-white border border-slate-200 shadow-xl'}`}
            >
              {/* Esports Neon Accents */}
              {mode === 'esports' && (
                <>
                  <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none"></div>
                  <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>
                </>
              )}

              {mode === 'admin' ? (
                // ADMIN MODE CONTENT
                <div className="space-y-8">
                  {/* Top Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                      <div className="flex items-center space-x-3 text-indigo-600 mb-3">
                        <TrendingUp className="h-6 w-6" />
                        <h3 className="font-semibold text-lg">Revenue Growth</h3>
                      </div>
                      <p className="text-4xl font-bold text-slate-900">+24.8%</p>
                      <p className="text-sm text-slate-500 mt-2">Compared to last month</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center space-x-3 text-emerald-600 mb-3">
                        <AlertCircle className="h-6 w-6" />
                        <h3 className="font-semibold text-lg">Cost Efficiency</h3>
                      </div>
                      <p className="text-4xl font-bold text-slate-900">12.3%</p>
                      <p className="text-sm text-slate-500 mt-2">Reduction in operations</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100">
                      <div className="flex items-center space-x-3 text-amber-600 mb-3">
                        <Sparkles className="h-6 w-6" />
                        <h3 className="font-semibold text-lg">AI Predictability</h3>
                      </div>
                      <p className="text-4xl font-bold text-slate-900">High</p>
                      <p className="text-sm text-slate-500 mt-2">94% confidence score</p>
                    </div>
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-semibold mb-6 text-slate-800">Monthly Revenue vs Cost</h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
                            <Bar dataKey="cost" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Cost" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col">
                      <h3 className="text-lg font-semibold mb-6 text-slate-800">Product Distribution</h3>
                      <div className="flex-grow h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={proportionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {proportionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row 2 & AI Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-semibold mb-6 text-slate-800">User Growth Projection</h3>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Total Users" />
                            <Line type="monotone" dataKey="active" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Active Users" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="p-8 rounded-2xl bg-slate-900 text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
                      <div className="absolute top-[-10%] right-[-10%] p-4 opacity-10 pointer-events-none">
                        <Sparkles className="h-48 w-48" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-6">
                          <Sparkles className="h-6 w-6 text-amber-400" />
                          <h3 className="text-xl font-bold">AI Executive Insights</h3>
                        </div>
                        <ul className="space-y-5">
                          <li className="flex items-start space-x-4">
                            <div className="mt-1 bg-emerald-500/20 p-1.5 rounded-full"><TrendingUp className="h-4 w-4 text-emerald-400" /></div>
                            <p className="text-base text-slate-300 leading-relaxed"><strong className="text-white">Q3 Revenue Spike:</strong> Anomali positif terdeteksi pada Q3. Tren ini kemungkinan berlanjut di Q4 jika budget marketing dipertahankan.</p>
                          </li>
                          <li className="flex items-start space-x-4">
                            <div className="mt-1 bg-amber-500/20 p-1.5 rounded-full"><AlertCircle className="h-4 w-4 text-amber-400" /></div>
                            <p className="text-base text-slate-300 leading-relaxed"><strong className="text-white">Cost Optimization:</strong> Biaya operasional di bulan Maret sangat tinggi. AI merekomendasikan audit vendor logistik.</p>
                          </li>
                          <li className="flex items-start space-x-4">
                            <div className="mt-1 bg-indigo-500/20 p-1.5 rounded-full"><Sparkles className="h-4 w-4 text-indigo-400" /></div>
                            <p className="text-base text-slate-300 leading-relaxed"><strong className="text-white">Product Strategy:</strong> Product A memimpin proporsi (33%). Fokuskan ekspansi pada produk A dan B untuk meminimalisir risiko.</p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // ESPORTS MODE CONTENT
                <div className="space-y-6 relative z-10">
                  {/* Top Stats / MVP Card */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 p-1 rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                      <div className="h-full w-full bg-zinc-950 rounded-xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-yellow-500 text-zinc-900 text-sm font-bold px-4 py-1 rounded-bl-lg rounded-tr-lg flex items-center space-x-1">
                          <Trophy className="h-4 w-4" />
                          <span>MVP</span>
                        </div>
                        <div className="w-28 h-28 rounded-full border-2 border-cyan-400 p-1 mb-5">
                          <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
                            <Gamepad2 className="h-12 w-12 text-cyan-400" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-wider mb-1">FAKER</h3>
                        <p className="text-cyan-400 text-sm font-semibold mb-8 tracking-widest uppercase">Mid Laner • T1</p>
                        
                        <div className="w-full grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-6">
                          <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Kills</p>
                            <p className="text-2xl font-black text-white">12</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Deaths</p>
                            <p className="text-2xl font-black text-red-400">2</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Assists</p>
                            <p className="text-2xl font-black text-cyan-400">8</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-2/3 grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center space-x-5">
                        <div className="p-4 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-900/50"><Crosshair className="h-8 w-8" /></div>
                        <div>
                          <p className="text-sm text-zinc-400 font-medium mb-1">Team Accuracy</p>
                          <p className="text-3xl font-bold text-white">68.4%</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center space-x-5">
                        <div className="p-4 rounded-xl bg-purple-950 text-purple-400 border border-purple-900/50"><Shield className="h-8 w-8" /></div>
                        <div>
                          <p className="text-sm text-zinc-400 font-medium mb-1">Damage Taken</p>
                          <p className="text-3xl font-bold text-white">124k</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center space-x-5 col-span-2">
                        <div className="p-4 rounded-xl bg-amber-950 text-amber-400 border border-amber-900/50"><Zap className="h-8 w-8" /></div>
                        <div className="flex-grow">
                          <div className="flex justify-between mb-2">
                            <p className="text-sm text-zinc-400 font-medium">Match Dominance Index</p>
                            <p className="text-sm text-amber-400 font-bold">87/100</p>
                          </div>
                          <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 w-[87%] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                      <h3 className="text-lg font-bold mb-6 text-white flex items-center"><Gamepad2 className="w-5 h-5 mr-2 text-cyan-400"/> KDA Comparison</h3>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={kdaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                            <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46', color: '#fff' }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="K" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Kills" />
                            <Bar dataKey="A" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Assists" />
                            <Bar dataKey="D" fill="#ef4444" radius={[4, 4, 0, 0]} name="Deaths" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-transparent pointer-events-none"></div>
                      <h3 className="text-lg font-bold mb-6 text-white flex items-center"><Crosshair className="w-5 h-5 mr-2 text-purple-400"/> MVP Stats Radar</h3>
                      <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={playerStatsData}>
                            <PolarGrid stroke="#3f3f46" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar name="Faker" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.5} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46', color: '#fff' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
