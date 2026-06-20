"use client"

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import html2canvas from 'html2canvas-pro';
import { 
  ShieldCheck, BarChart2, FileText, Download, Image as ImageIcon, 
  UploadCloud, Sparkles, Loader2, AlertTriangle, CheckCircle
} from 'lucide-react';

type Tab = 'audit' | 'visualisasi' | 'laporan';

interface DataRow {
  [key: string]: any;
}

interface AuditLog {
  no: number;
  namaKolom: string;
  jumlahKosong: number;
  status: 'Bersih' | 'Perlu Perhatian';
}

interface VisualisasiData {
  tipe: 'bar' | 'pie' | 'none';
  barData?: any[];
  barXKey?: string;
  pieData?: any[];
  pieNameKey?: string;
  pieValueKey?: string;
}

export default function AnalyticaAI() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('audit');
  const [isParsing, setIsParsing] = useState(false);
  
  // Data States
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  // Audit States
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [problematicRows, setProblematicRows] = useState(0);
  const [healthScore, setHealthScore] = useState(100);
  
  // Visualisasi States
  const [visData, setVisData] = useState<VisualisasiData>({ tipe: 'none' });
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Laporan States
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportParts, setReportParts] = useState<{ p1: string, p2: string, p3: string } | null>(null);

  // PIE CHART COLORS
  const PIE_COLORS = ["#2563EB", "#14B8A6", "#6366F1", "#F59E0B", "#EF4444", "#10B981"];

  const processData = (data: DataRow[]) => {
    if (!data || data.length === 0) return;
    
    const cols = Object.keys(data[0]);
    setColumns(cols);
    setRawData(data);
    setTotalRows(data.length);

    // --- AUDIT PROSES ---
    let problemCount = 0;
    const logs: AuditLog[] = cols.map((col, idx) => {
      let emptyCount = 0;
      data.forEach(row => {
        if (row[col] === null || row[col] === undefined || row[col] === '') {
          emptyCount++;
        }
      });
      if (emptyCount > 0) problemCount += emptyCount; // simple problem tracking

      return {
        no: idx + 1,
        namaKolom: col,
        jumlahKosong: emptyCount,
        status: emptyCount === 0 ? 'Bersih' : 'Perlu Perhatian'
      };
    });

    // Hitung baris bermasalah (aproksimasi sederhana: tiap cell kosong = 1 masalah max sejumlah baris)
    let rowsWithIssues = 0;
    data.forEach(row => {
      const hasEmpty = cols.some(c => row[c] === null || row[c] === undefined || row[c] === '');
      if (hasEmpty) rowsWithIssues++;
    });

    setProblematicRows(rowsWithIssues);
    const health = data.length > 0 ? Math.round(((data.length - rowsWithIssues) / data.length) * 100) : 0;
    setHealthScore(health);
    setAuditLogs(logs);

    // --- VISUALISASI PROSES (Auto-Detect) ---
    // Logika Deteksi:
    // Kolom Periode: mengandung kata "tanggal", "date", "bulan", "tahun", "period"
    // Kolom Kategori: kolom string dengan unique values < 20% dari total data atau <= 10 unique values
    // Kolom Numerik: untuk values
    
    let dateCol = cols.find(c => c.toLowerCase().match(/tanggal|date|bulan|month|tahun|year|periode|waktu/));
    let catCol = cols.find(c => {
      if (c === dateCol) return false;
      const uniques = new Set(data.map(r => r[c])).size;
      return uniques <= 15 && uniques > 1; // kategori
    });
    
    let numCol = cols.find(c => typeof data[0][c] === 'number');
    
    const newVis: VisualisasiData = { tipe: 'none' };
    
    if (dateCol) {
      // Aggregate for Bar Chart
      const agg: Record<string, number> = {};
      data.forEach(r => {
        const key = String(r[dateCol]);
        const val = numCol ? Number(r[numCol]) || 1 : 1;
        agg[key] = (agg[key] || 0) + val;
      });
      newVis.barData = Object.entries(agg).map(([k, v]) => ({ name: k, value: v })).slice(0, 20); // max 20
      newVis.barXKey = dateCol;
      newVis.tipe = 'bar';
    }
    
    if (catCol) {
      // Aggregate for Pie Chart
      const agg: Record<string, number> = {};
      data.forEach(r => {
        const key = String(r[catCol]);
        const val = numCol ? Number(r[numCol]) || 1 : 1;
        agg[key] = (agg[key] || 0) + val;
      });
      newVis.pieData = Object.entries(agg).map(([k, v]) => ({ name: k, value: v })).slice(0, 10); // max 10
      newVis.pieNameKey = catCol;
      newVis.pieValueKey = "value";
      newVis.tipe = dateCol ? 'bar' : 'pie'; // if both, we render both later
      if (dateCol) newVis.tipe = 'bar'; // just to denote it has data
    }
    
    setVisData(newVis);
  };

  const parseFile = (fileObj: File) => {
    setIsParsing(true);
    setFileName(fileObj.name);

    if (fileObj.name.endsWith('.csv')) {
      Papa.parse(fileObj, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data as DataRow[]);
          setIsParsing(false);
        },
        error: (err) => {
          console.error("Parse Error:", err);
          setIsParsing(false);
        }
      });
    } else if (fileObj.name.match(/\.xlsx?$/)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          processData(jsonData as DataRow[]);
        } catch (error) {
          console.error("Excel Parse Error:", error);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(fileObj);
    } else {
      alert("Format file tidak didukung!");
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    
    // Siapkan ringkasan untuk API
    const summary = `
      File: ${fileName}
      Total Baris: ${totalRows}
      Total Kolom: ${columns.length}
      Kolom: ${columns.join(', ')}
      Baris Bermasalah: ${problematicRows}
      Kesehatan Data: ${healthScore}%
      Data Visualisasi Terdeteksi: ${visData.barXKey ? 'Periode: ' + visData.barXKey : ''} ${visData.pieNameKey ? 'Kategori: ' + visData.pieNameKey : ''}
    `;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSummary: summary })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Pisahkan output teks menjadi 3 bagian sederhana berdasarkan pola (1) (2) (3)
      const text = data.report as string;
      const p1Match = text.match(/(?:\(1\)|1\.|Ringkasan Utama).*?(?=(?:\(2\)|2\.|Temuan dan Anomali))/is);
      const p2Match = text.match(/(?:\(2\)|2\.|Temuan dan Anomali).*?(?=(?:\(3\)|3\.|Saran Tindakan))/is);
      const p3Match = text.match(/(?:\(3\)|3\.|Saran Tindakan).*/is);

      setReportParts({
        p1: p1Match ? p1Match[0].replace(/(?:\(1\)|1\.|Ringkasan Utama)[:\-]?/i, '').trim() : "Tidak dapat mengekstrak ringkasan utama.",
        p2: p2Match ? p2Match[0].replace(/(?:\(2\)|2\.|Temuan dan Anomali)[:\-]?/i, '').trim() : "Tidak dapat mengekstrak temuan.",
        p3: p3Match ? p3Match[0].replace(/(?:\(3\)|3\.|Saran Tindakan)[:\-]?/i, '').trim() : text,
      });

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 2 });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Grafik_${fileName}.png`;
    link.click();
  };

  const printPDF = () => {
    window.print();
  };

  // Render Landing Page
  if (!fileName && !isParsing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600 mb-4 flex items-center justify-center">
            <BarChart2 className="w-12 h-12 mr-3" />
            Analytica AI
          </h1>
          <p className="text-slate-600 text-lg">
            Unggah file spreadsheet Anda dan biarkan AI menganalisisnya secara otomatis
          </p>
        </div>

        <div 
          className="w-full max-w-2xl bg-white border-2 border-dashed border-blue-300 rounded-xl p-12 text-center shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <input 
            id="fileUpload"
            type="file" 
            accept=".csv, .xlsx, .xls"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex justify-center mb-4 text-blue-500">
            <UploadCloud className="w-16 h-16" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Seret & Lepas File ke Sini</h3>
          <p className="text-slate-500">atau klik untuk memilih file</p>
        </div>
        <p className="mt-6 text-sm text-slate-400">Mendukung format: Excel (.xlsx, .xls) dan CSV (.csv)</p>
      </div>
    );
  }

  // Render Loading
  if (isParsing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Membaca data Anda...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 print:bg-white print:pb-0">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-800">Analytica AI</span>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-full text-sm font-medium text-slate-600 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-teal-500" />
            File: <span className="font-bold text-slate-800 ml-1">{fileName}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex space-x-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center ${activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Audit Data
          </button>
          <button 
            onClick={() => setActiveTab('visualisasi')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center ${activeTab === 'visualisasi' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <BarChart2 className="w-4 h-4 mr-2" /> Visualisasi
          </button>
          <button 
            onClick={() => setActiveTab('laporan')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center ${activeTab === 'laporan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FileText className="w-4 h-4 mr-2" /> Laporan AI
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0">
        
        {/* TAB 1: AUDIT DATA */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-500 print:block">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 print:hidden">Ringkasan Audit Data</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Baris Data</p>
                <p className="text-3xl font-bold text-slate-800">{totalRows.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Jumlah Kolom</p>
                <p className="text-3xl font-bold text-slate-800">{columns.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Baris Bermasalah</p>
                <p className="text-3xl font-bold text-red-500">{problematicRows.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Tingkat Kesehatan Data</p>
                <p className="text-3xl font-bold text-teal-500">{healthScore}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Tabel Log Pemeriksaan</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm">
                      <th className="px-6 py-3 font-semibold border-b border-slate-200">No</th>
                      <th className="px-6 py-3 font-semibold border-b border-slate-200">Nama Kolom</th>
                      <th className="px-6 py-3 font-semibold border-b border-slate-200">Jumlah Nilai Kosong</th>
                      <th className="px-6 py-3 font-semibold border-b border-slate-200">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.no} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">{log.no}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800 border-b border-slate-100">{log.namaKolom}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">{log.jumlahKosong}</td>
                        <td className="px-6 py-4 border-b border-slate-100">
                          {log.status === 'Bersih' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" /> Bersih
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Perlu Perhatian
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notification Box */}
            {auditLogs.filter(l => l.jumlahKosong > 0).length > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start mt-6">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  AI mendeteksi adanya baris data kosong pada kolom {auditLogs.filter(l => l.jumlahKosong > 0).map(l => `[${l.namaKolom}]`).join(', ')}. Walaupun data kotor telah teridentifikasi, untuk tujuan analitik otomatis, AI akan menyesuaikan perhitungannya dengan mengabaikan nilai kosong (null) tersebut agar grafik tetap relevan.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start mt-6">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  Struktur data Anda terlihat sangat rapi dan bersih. Tidak terdeteksi adanya data yang kosong atau rusak. AI siap memvisualisasikan data Anda secara optimal!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VISUALISASI */}
        {activeTab === 'visualisasi' && (
          <div className="space-y-8 animate-in fade-in duration-500 print:block" ref={chartRef}>
            <h2 className="text-2xl font-bold text-slate-800 print:hidden mb-2">Visualisasi Otomatis</h2>
            
            {(!visData.barData && !visData.pieData) ? (
              <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Visualisasi Tidak Tersedia</h3>
                <p className="text-slate-500">Data tidak memiliki kolom periode atau kategori yang dapat divisualisasikan secara otomatis.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Render Bar Chart if available */}
                {visData.barData && visData.barXKey && (
                  <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">
                      Distribusi Frekuensi Berdasarkan {visData.barXKey}
                    </h3>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visData.barData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            angle={-45} 
                            textAnchor="end"
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                          />
                          <Bar dataKey="value" name="Jumlah" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Render Pie Chart if available */}
                {visData.pieData && visData.pieNameKey && (
                  <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">
                      Proporsi Distribusi Kategori ({visData.pieNameKey})
                    </h3>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={visData.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={130}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {visData.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LAPORAN AI */}
        {activeTab === 'laporan' && (
          <div className="space-y-6 animate-in fade-in duration-500 print:block">
            <h2 className="text-2xl font-bold text-slate-800 print:hidden mb-4">Laporan Eksekutif AI</h2>
            
            {!reportParts && !isGeneratingReport && (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center print:hidden">
                <Sparkles className="w-16 h-16 text-teal-500 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Laporan Belum Dibuat</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Analytica AI akan membaca metrik dan pola dari data Anda, lalu menyusun laporan naratif formal secara instan menggunakan model AI terkini.
                </p>
                <button 
                  onClick={generateReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Laporan AI
                </button>
              </div>
            )}

            {isGeneratingReport && (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center print:hidden">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Analytica AI sedang menganalisis data Anda...</h3>
                <p className="text-slate-500 mt-2">Menyusun ringkasan, menemukan anomali, dan merumuskan saran tindakan.</p>
              </div>
            )}

            {reportParts && !isGeneratingReport && (
              <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0">
                <div className="text-center mb-10 border-b border-slate-200 pb-6">
                  <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-wide mb-2">Laporan Eksekutif</h1>
                  <p className="text-slate-500">Dihasilkan oleh Analytica AI • {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="space-y-10">
                  <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center border-l-4 border-blue-600 pl-3">
                      1. Ringkasan Utama
                    </h2>
                    <div className="text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap">
                      {reportParts.p1}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center border-l-4 border-teal-500 pl-3">
                      2. Temuan dan Anomali
                    </h2>
                    <div className="text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap">
                      {reportParts.p2}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center border-l-4 border-indigo-500 pl-3">
                      3. Saran Tindakan
                    </h2>
                    <div className="text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap bg-blue-50/50 p-6 rounded-lg border border-blue-100">
                      {reportParts.p3}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Bar / Export Features */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden z-20">
        <div className="max-w-7xl mx-auto flex justify-center sm:justify-end space-x-4">
          <button 
            onClick={exportPNG}
            className="flex items-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors border border-slate-300"
          >
            <ImageIcon className="w-5 h-5 mr-2 text-teal-600" />
            Ekspor Grafik (PNG)
          </button>
          <button 
            onClick={printPDF}
            className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-5 h-5 mr-2" />
            Unduh Laporan (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
