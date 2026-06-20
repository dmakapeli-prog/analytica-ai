"use client"

import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { 
  Download, FileSpreadsheet, Gamepad2, UploadCloud, 
  Sparkles, TrendingUp, AlertCircle, FileImage, 
  Lightbulb, Palette, FileText, Target, Activity
} from 'lucide-react';

// --- MOCK DATA ---
const trendData = [
  { bulan: 'Jan', pendapatan: 45000, pengeluaran: 28000 },
  { bulan: 'Feb', pendapatan: 52000, pengeluaran: 30000 },
  { bulan: 'Mar', pendapatan: 48000, pengeluaran: 25000 },
  { bulan: 'Apr', pendapatan: 61000, pengeluaran: 32000 },
  { bulan: 'Mei', pendapatan: 59000, pengeluaran: 35000 },
  { bulan: 'Jun', pendapatan: 75000, pengeluaran: 40000 },
];

const growthData = [
  { kuartal: 'Q1', pengguna: 12000, aktif: 8500 },
  { kuartal: 'Q2', pengguna: 25000, aktif: 18000 },
  { kuartal: 'Q3', pengguna: 48000, aktif: 39000 },
  { kuartal: 'Q4', pengguna: 82000, aktif: 71000 },
];

const playerStatsData = [
  { aspek: 'Akurasi', nilai: 95, max: 100 },
  { aspek: 'Mobilitas', nilai: 88, max: 100 },
  { aspek: 'Kerja Sama', nilai: 92, max: 100 },
  { aspek: 'Visi Peta', nilai: 85, max: 100 },
  { aspek: 'Agresivitas', nilai: 78, max: 100 },
  { aspek: 'Bertahan', nilai: 82, max: 100 },
];

const kdaData = [
  { pemain: 'Player 1', Kills: 15, Deaths: 3, Assists: 8 },
  { pemain: 'Player 2', Kills: 8, Deaths: 5, Assists: 12 },
  { pemain: 'Player 3', Kills: 4, Deaths: 7, Assists: 18 },
  { pemain: 'Player 4', Kills: 20, Deaths: 2, Assists: 5 },
  { pemain: 'Player 5', Kills: 2, Deaths: 6, Assists: 22 },
];

type AppMode = 'dokumen' | 'esports';
type AppTheme = 'modern' | 'cinematic' | 'profesional';

export default function AIInfographicGenerator() {
  const [mode, setMode] = useState<AppMode>('dokumen');
  const [theme, setTheme] = useState<AppTheme>('modern');
  const [file, setFile] = useState<File | null>(null);
  
  // Loading States
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Theme Configurations
  const getThemeConfig = () => {
    switch (theme) {
      case 'cinematic':
        return {
          wrapper: 'bg-zinc-950 text-white selection:bg-cyan-500/30',
          dashboardBg: 'bg-zinc-950 border border-zinc-800 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden',
          card: 'bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:border-cyan-500/50 transition-all duration-300 shadow-lg',
          accent1: '#06b6d4', // Cyan
          accent2: '#8b5cf6', // Purple
          accent3: '#ef4444', // Red for KDA
          textMain: 'text-white',
          textSub: 'text-zinc-400',
          gridLine: '#27272a',
          glowEffect: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
          badgeBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        };
      case 'profesional':
        return {
          wrapper: 'bg-gray-100 text-gray-900 selection:bg-emerald-500/30',
          dashboardBg: 'bg-white border-t-4 border-t-slate-800 border-x border-b border-gray-300 shadow-md rounded-none',
          card: 'bg-white border border-gray-200 shadow-sm rounded-none',
          accent1: '#0f172a', // Slate 900
          accent2: '#059669', // Emerald
          accent3: '#dc2626', // Red
          textMain: 'text-gray-900',
          textSub: 'text-gray-600',
          gridLine: '#e5e7eb',
          glowEffect: '',
          badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300 rounded-none',
        };
      case 'modern':
      default:
        return {
          wrapper: 'bg-slate-50 text-slate-900 selection:bg-indigo-500/30',
          dashboardBg: 'bg-white border border-slate-200 shadow-2xl rounded-3xl',
          card: 'bg-white border border-slate-100 shadow-sm rounded-2xl',
          accent1: '#6366f1', // Indigo
          accent2: '#14b8a6', // Teal
          accent3: '#f43f5e', // Rose
          textMain: 'text-slate-800',
          textSub: 'text-slate-500',
          gridLine: '#f1f5f9',
          glowEffect: '',
          badgeBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full',
        };
    }
  };

  const tc = getThemeConfig();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsProcessing(true);
      setShowResult(false);
      setProgress(0);
      setLoadingStep(1); // 1: Membaca struktur, 2: Menentukan model
      
      // Mock progress with 2 steps
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 2;
        setProgress(currentProgress);
        
        if (currentProgress === 40) {
          setLoadingStep(2);
        }
        
        if (currentProgress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setShowResult(true);
        }
      }, 50);
    }
  };

  const exportPNG = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Infografis_${mode}_${theme}_${Date.now()}.png`;
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
    pdf.save(`Infografis_${mode}_${theme}_${Date.now()}.pdf`);
  };

  const resetState = () => {
    setFile(null);
    setShowResult(false);
    setProgress(0);
    setLoadingStep(0);
  };

  // Switch mode also suggests a theme
  const changeMode = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'esports') setTheme('cinematic');
    if (newMode === 'dokumen') setTheme('modern');
    resetState();
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${tc.wrapper}`}>
      {/* Header & Main Tabs */}
      <header className="sticky top-0 z-20 backdrop-blur-xl border-b border-black/5 dark:border-white/5 bg-inherit/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-indigo-500" />
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-teal-400">
              SmartGraph AI
            </h1>
          </div>
          
          <div className="flex p-1 space-x-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <button 
              onClick={() => changeMode('dokumen')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'dokumen' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Analisis Dokumen (Excel/CSV)</span>
            </button>
            <button 
              onClick={() => changeMode('esports')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'esports' ? 'bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Analisis Gambar (Esports/Data)</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* State 1: Upload / Dropzone */}
        {!showResult && (
          <div className="max-w-3xl mx-auto mt-8 sm:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`text-center mb-10`}>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                {mode === 'dokumen' ? 'Ubah Data Mentah Menjadi Wawasan' : 'Ekstrak Statistik dari Tangkapan Layar'}
              </h2>
              <p className="text-lg opacity-60">
                {mode === 'dokumen' 
                  ? 'Unggah file Spreadsheet (.xlsx, .csv) Anda. AI kami akan menganalisis dan memilih visualisasi terbaik secara otomatis.' 
                  : 'Unggah screenshot hasil pertandingan (.png, .jpg). Vision AI kami akan mengekstrak data KDA dan merangkum performa.'}
              </p>
            </div>

            <div className={`relative group rounded-3xl border-2 border-dashed p-10 sm:p-20 transition-all duration-300 hover:scale-[1.02] bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 ${mode === 'dokumen' ? 'border-indigo-300 hover:border-indigo-500' : 'border-cyan-300 hover:border-cyan-500'}`}>
              <input 
                type="file" 
                accept={mode === 'dokumen' ? ".csv, .xlsx" : "image/png, image/jpeg"}
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isProcessing}
              />
              <div className="flex flex-col items-center justify-center space-y-6 text-center">
                <div className={`p-6 rounded-full transition-transform group-hover:scale-110 ${mode === 'dokumen' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400'}`}>
                  {mode === 'dokumen' ? <UploadCloud className="h-12 w-12" /> : <FileImage className="h-12 w-12" />}
                </div>
                <div>
                  <p className="text-xl font-semibold">
                    Tarik & Lepas file ke area ini
                  </p>
                  <p className="text-sm mt-2 opacity-60">
                    atau klik untuk mencari file dari perangkat Anda
                  </p>
                  <p className="text-xs mt-4 font-medium opacity-50 uppercase tracking-widest">
                    {mode === 'dokumen' ? 'Format didukung: XLSX, CSV (Maks 10MB)' : 'Format didukung: PNG, JPG (Maks 5MB)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Processing State */}
            {isProcessing && (
              <div className="mt-10 space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center space-x-3">
                    <Sparkles className={`h-5 w-5 animate-pulse ${mode === 'dokumen' ? 'text-indigo-500' : 'text-cyan-500'}`} />
                    <span>
                      {loadingStep === 1 
                        ? (mode === 'dokumen' ? 'AI sedang membaca struktur data...' : 'Vision AI sedang memindai piksel gambar...') 
                        : (mode === 'dokumen' ? 'AI menentukan model grafik terbaik untuk data Anda...' : 'AI menstrukturkan data statistik pemain...')}
                    </span>
                  </div>
                  <span className="font-mono text-lg">{progress}%</span>
                </div>
                <div className="h-3 w-full rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                  <div 
                    className={`h-full transition-all duration-75 ease-linear ${mode === 'dokumen' ? 'bg-gradient-to-r from-indigo-500 to-teal-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
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
            
            {/* Top Toolbar (Theme Switcher & Export) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/50 dark:bg-zinc-900/50 p-4 rounded-2xl backdrop-blur-md border border-black/5 dark:border-white/5">
              
              {/* Theme Switcher */}
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5 opacity-60" />
                <span className="text-sm font-medium mr-2">Pilih Gaya:</span>
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                  {(['modern', 'cinematic', 'profesional'] as AppTheme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${theme === t ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex space-x-3">
                <button 
                  onClick={exportPNG}
                  className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <FileImage className="h-4 w-4" />
                  <span>Ekspor PNG</span>
                </button>
                <button 
                  onClick={exportPDF}
                  className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-md bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                  <Download className="h-4 w-4" />
                  <span>Ekspor PDF</span>
                </button>
              </div>
            </div>

            {/* THE DASHBOARD CANVAS */}
            <div 
              ref={dashboardRef} 
              className={`p-6 sm:p-10 transition-all duration-500 ${tc.dashboardBg}`}
            >
              {/* Cinematic Background Glow Elements */}
              {theme === 'cinematic' && (
                <>
                  <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>
                </>
              )}

              {/* Header Info Dashboard */}
              <div className="mb-8 border-b border-black/5 dark:border-white/5 pb-6">
                <h2 className={`text-3xl font-bold mb-2 ${tc.textMain}`}>
                  {mode === 'dokumen' ? 'Laporan Intelijen Bisnis' : 'Analisis Performa Pertandingan'}
                </h2>
                <p className={`${tc.textSub} flex items-center`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Sumber data: {file?.name || 'Data_Unggahan.csv'} • Dihasilkan otomatis oleh SmartGraph AI
                </p>
              </div>

              {mode === 'dokumen' ? (
                // --- KONTEN TAB DOKUMEN ---
                <div className="space-y-8 relative z-10">
                  
                  {/* AI SMART SELECTOR NOTE */}
                  <div className={`p-4 rounded-xl flex items-start space-x-4 border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200`}>
                    <Lightbulb className="h-6 w-6 mt-0.5 flex-shrink-0 text-indigo-500" />
                    <div>
                      <h4 className="font-bold mb-1">💡 AI Note: Pemilihan Model Grafik</h4>
                      <p className="text-sm leading-relaxed opacity-90">
                        Berdasarkan data yang Anda unggah, AI mendeteksi adanya struktur waktu (bulan/kuartal) dan metrik komparatif (Pendapatan vs Pengeluaran). Oleh karena itu, <strong>Bar Chart Terkelompok</strong> adalah pilihan terbaik untuk melihat margin per bulan secara absolut, dan <strong>Line Chart</strong> sangat efektif memproyeksikan lintasan pertumbuhan pengguna.
                      </p>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Chart 1: Bar Chart */}
                    <div className={`p-6 ${tc.card}`}>
                      <h3 className={`text-xl font-bold mb-6 ${tc.textMain}`}>Tren Pendapatan vs Pengeluaran</h3>
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tc.gridLine} />
                            <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fill: tc.chartText }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: tc.chartText }} tickFormatter={(val) => `Rp${val/1000}k`} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: theme === 'cinematic' ? '#18181b' : '#fff', borderColor: tc.gridLine, color: tc.textMain, borderRadius: theme === 'profesional' ? '0px' : '12px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="pendapatan" name="Pendapatan" fill={tc.accent1} radius={theme === 'profesional' ? [0,0,0,0] : [6, 6, 0, 0]} />
                            <Bar dataKey="pengeluaran" name="Pengeluaran" fill={tc.accent3} radius={theme === 'profesional' ? [0,0,0,0] : [6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Line Chart */}
                    <div className={`p-6 ${tc.card}`}>
                      <h3 className={`text-xl font-bold mb-6 ${tc.textMain}`}>Lintasan Pertumbuhan Pengguna</h3>
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tc.gridLine} />
                            <XAxis dataKey="kuartal" axisLine={false} tickLine={false} tick={{ fill: tc.chartText }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: tc.chartText }} />
                            <Tooltip contentStyle={{ backgroundColor: theme === 'cinematic' ? '#18181b' : '#fff', borderColor: tc.gridLine, color: tc.textMain, borderRadius: theme === 'profesional' ? '0px' : '12px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line type="monotone" dataKey="pengguna" name="Total Pengguna" stroke={tc.accent1} strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: tc.dashboardBg }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="aktif" name="Pengguna Aktif" stroke={tc.accent2} strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: tc.dashboardBg }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                  {/* AI Insight Summary */}
                  <div className={`p-6 sm:p-8 mt-8 border-l-4 ${theme === 'cinematic' ? 'bg-zinc-900 border-teal-500' : 'bg-slate-50 border-teal-500'} ${theme === 'profesional' ? 'rounded-none' : 'rounded-2xl'}`}>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className={`p-2 rounded-lg ${tc.badgeBg}`}>
                        <Target className="h-6 w-6" />
                      </div>
                      <h3 className={`text-2xl font-bold ${tc.textMain}`}>Rangkuman Otomatis AI</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textSub} flex items-center`}><TrendingUp className="w-4 h-4 mr-2"/> Sorotan Tren</div>
                        <p className={`text-sm leading-relaxed ${tc.textMain}`}>
                          Pendapatan terus meningkat secara stabil dari Bulan Maret hingga Juni, mencapai puncaknya di angka <strong>Rp75.000.000</strong>. Margin kotor juga semakin melebar di Q2.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textSub} flex items-center`}><AlertCircle className="w-4 h-4 mr-2"/> Deteksi Anomali</div>
                        <p className={`text-sm leading-relaxed ${tc.textMain}`}>
                          Terdapat anomali penurunan pendapatan di bulan <strong>Maret</strong> sementara biaya operasional stagnan. Hal ini mengindikasikan ketidakefisienan pada periode tersebut.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textSub} flex items-center`}><Sparkles className="w-4 h-4 mr-2"/> Actionable Insights</div>
                        <p className={`text-sm leading-relaxed ${tc.textMain}`}>
                          Rasio pengguna aktif terhadap total pengguna menyempit di Q4 (86%). Pertahankan momentum ini dengan meluncurkan kampanye retensi di awal Q1 tahun depan.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                // --- KONTEN TAB ESPORTS ---
                <div className="space-y-8 relative z-10">
                  
                  {/* AI SMART SELECTOR NOTE */}
                  <div className={`p-4 rounded-xl flex items-start space-x-4 border-l-4 border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-200`}>
                    <Lightbulb className="h-6 w-6 mt-0.5 flex-shrink-0 text-cyan-500" />
                    <div>
                      <h4 className="font-bold mb-1">💡 AI Note: Pemilihan Model Grafik</h4>
                      <p className="text-sm leading-relaxed opacity-90">
                        Berdasarkan tangkapan layar, AI berhasil mengekstrak metrik multi-dimensi pemain dan statistik KDA kompetitif. <strong>Radar Chart</strong> digunakan untuk memvisualisasikan kelengkapan *skill* secara holistik, sedangkan <strong>Horizontal Bar Chart</strong> dipilih karena lebih optimal membandingkan akumulasi *Kills, Deaths, Assists* antar pemain dalam format papan peringkat (Leaderboard).
                      </p>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Chart 1: Radar Chart */}
                    <div className={`p-6 flex flex-col justify-between ${tc.card}`}>
                      <h3 className={`text-xl font-bold mb-6 flex items-center ${tc.textMain}`}>
                        <Target className="w-5 h-5 mr-2" /> Keseimbangan Performa Tim
                      </h3>
                      <div className="h-[320px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={playerStatsData}>
                            <PolarGrid stroke={tc.gridLine} />
                            <PolarAngleAxis dataKey="aspek" tick={{ fill: tc.chartText, fontSize: 13, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Skor Tim" dataKey="nilai" stroke={tc.accent1} strokeWidth={3} fill={tc.accent1} fillOpacity={theme === 'cinematic' ? 0.4 : 0.2} />
                            <Tooltip contentStyle={{ backgroundColor: theme === 'cinematic' ? '#18181b' : '#fff', borderColor: tc.gridLine, color: tc.textMain }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Horizontal Bar Chart */}
                    <div className={`p-6 flex flex-col justify-between ${tc.card}`}>
                      <h3 className={`text-xl font-bold mb-6 flex items-center ${tc.textMain}`}>
                        <Gamepad2 className="w-5 h-5 mr-2" /> Komparasi KDA Papan Peringkat
                      </h3>
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={kdaData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={tc.gridLine} />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: tc.chartText }} />
                            <YAxis dataKey="pemain" type="category" axisLine={false} tickLine={false} tick={{ fill: tc.chartText, fontWeight: 500 }} width={80} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: theme === 'cinematic' ? '#18181b' : '#fff', borderColor: tc.gridLine, color: tc.textMain, borderRadius: theme === 'profesional' ? '0px' : '12px' }} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="Kills" stackId="a" fill={tc.accent1} name="Kills (K)" radius={theme === 'profesional' ? [0,0,0,0] : [0, 4, 4, 0]} />
                            <Bar dataKey="Assists" stackId="a" fill={tc.accent2} name="Assists (A)" radius={theme === 'profesional' ? [0,0,0,0] : [0, 4, 4, 0]} />
                            <Bar dataKey="Deaths" fill={tc.accent3} name="Deaths (D)" radius={theme === 'profesional' ? [0,0,0,0] : [0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                  {/* AI Insight Summary - Esports */}
                  <div className={`p-6 sm:p-8 mt-8 border-l-4 ${theme === 'cinematic' ? 'bg-zinc-900 border-purple-500' : 'bg-slate-50 border-purple-500'} ${theme === 'profesional' ? 'rounded-none' : 'rounded-2xl'}`}>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className={`p-2 rounded-lg ${tc.badgeBg}`}>
                        <Activity className="h-6 w-6" />
                      </div>
                      <h3 className={`text-2xl font-bold ${tc.textMain}`}>Rangkuman Otomatis AI</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textSub} flex items-center`}><TrendingUp className="w-4 h-4 mr-2"/> Sorotan Tren</div>
                        <p className={`text-sm leading-relaxed ${tc.textMain}`}>
                          <strong>Player 4</strong> mendominasi jumlah <em>Kills</em> (20) dengan tingkat kematian sangat minim, menjadikannya MVP dalam parameter <em>Damage Output</em>.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textSub} flex items-center`}><AlertCircle className="w-4 h-4 mr-2"/> Deteksi Anomali</div>
                        <p className={`text-sm leading-relaxed ${tc.textMain}`}>
                          Radar Chart menunjukkan <strong>Agresivitas tim</strong> berada di angka terendah (78). Tim bermain terlalu pasif dan mengandalkan visi peta ketimbang inisiasi serangan.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${tc.textSub} flex items-center`}><Sparkles className="w-4 h-4 mr-2"/> Actionable Insights</div>
                        <p className={`text-sm leading-relaxed ${tc.textMain}`}>
                          Tingkatkan tempo permainan (Agresivitas) di ronde awal. Manfaatkan <strong>Player 5</strong> yang memiliki tingkat <em>Assists</em> tertinggi (22) sebagai inisiator utama *teamfight*.
                        </p>
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
