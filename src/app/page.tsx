"use client"

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize={14}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
import html2canvas from 'html2canvas-pro';
import { 
  ShieldCheck, BarChart2, FileText, Download, Image as ImageIcon, 
  UploadCloud, Sparkles, Loader2, AlertTriangle, CheckCircle, Info, Database, List
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

    let problemCount = 0;
    const logs: AuditLog[] = cols.map((col, idx) => {
      let emptyCount = 0;
      data.forEach(row => {
        if (row[col] === null || row[col] === undefined || row[col] === '') {
          emptyCount++;
        }
      });
      if (emptyCount > 0) problemCount += emptyCount;

      return {
        no: idx + 1,
        namaKolom: col,
        jumlahKosong: emptyCount,
        status: emptyCount === 0 ? 'Bersih' : 'Perlu Perhatian'
      };
    });

    let rowsWithIssues = 0;
    data.forEach(row => {
      const hasEmpty = cols.some(c => row[c] === null || row[c] === undefined || row[c] === '');
      if (hasEmpty) rowsWithIssues++;
    });

    setProblematicRows(rowsWithIssues);
    const health = data.length > 0 ? Math.round(((data.length - rowsWithIssues) / data.length) * 100) : 0;
    setHealthScore(health);
    setAuditLogs(logs);

    const MONTHS = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];

    let dateCol = cols.find(c => {
      const hasMonth = data.some(r => {
        const val = String(r[c]).toLowerCase();
        return MONTHS.some(m => val.includes(m));
      });
      return hasMonth;
    });
    
    if (!dateCol) {
      dateCol = cols.find(c => {
        if (!c.toLowerCase().match(/tanggal|date|bulan|month|periode|waktu/)) return false;
        const allYears = data.every(row => row[c] && String(row[c]).match(/^\d{4}$/));
        return !allYears;
      });
    }
    
    if (!dateCol) {
      dateCol = cols.find(c => {
        const uniques = new Set(data.map(r => r[c])).size;
        return uniques <= 15 && uniques > 1;
      });
    }

    let catCol = cols.find(c => {
      if (c === dateCol) return false;
      const cLower = c.toLowerCase();
      if (cLower.match(/kategori|jenis|tipe|status|produk|item|nama/)) return true;
      const uniques = new Set(data.map(r => r[c])).size;
      return uniques <= 15 && uniques > 1;
    });

    if (!catCol) {
      catCol = cols.find(c => {
        if (c === dateCol) return false;
        const uniques = new Set(data.map(r => r[c])).size;
        return uniques <= 15 && uniques > 1;
      });
    }

    let numCol = cols.find(c => typeof data[0][c] === 'number');
    
    const newVis: VisualisasiData = { tipe: 'none' };
    
    const getMonthIndex = (str: string) => {
      const lower = String(str).toLowerCase();
      const index = MONTHS.findIndex(m => lower.includes(m));
      return index !== -1 ? index : 999;
    };

    if (dateCol) {
      const validDateCol = dateCol;
      const agg: Record<string, number> = {};
      data.forEach(r => {
        let key = r[validDateCol];
        if (key === undefined || key === null || key === "" || String(key).trim() === "" || String(key).toLowerCase() === "undefined") return;
        key = String(key).trim();
        const val = numCol ? Number(r[numCol]) || 1 : 1;
        agg[key] = (agg[key] || 0) + val;
      });
      
      const barData = Object.entries(agg)
        .map(([k, v]) => ({ name: k, value: v }))
        .sort((a, b) => getMonthIndex(a.name) - getMonthIndex(b.name))
        .slice(0, 20);
        
      newVis.barData = barData;
      newVis.barXKey = validDateCol;
      newVis.tipe = 'bar';
    }
    
    if (catCol) {
      const validCatCol = catCol;
      const agg: Record<string, number> = {};
      data.forEach(r => {
        let key = r[validCatCol];
        if (key === undefined || key === null || key === "" || String(key).trim() === "" || String(key).toLowerCase() === "undefined") return;
        key = String(key).trim();
        const val = numCol ? Number(r[numCol]) || 1 : 1;
        agg[key] = (agg[key] || 0) + val;
      });
      newVis.pieData = Object.entries(agg)
        .map(([k, v]) => ({ name: k, value: v }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      newVis.pieNameKey = validCatCol;
      newVis.pieValueKey = "value";
      newVis.tipe = dateCol ? 'bar' : 'pie';
      if (dateCol) newVis.tipe = 'bar';
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
    
    const summaryObj = {
      nama_file: fileName,
      total_baris: totalRows,
      total_kolom: columns.length,
      daftar_kolom: columns,
      kesehatan_data: `${healthScore}%`,
      baris_bermasalah: problematicRows,
      sample_data: rawData.slice(0, 5)
    };
    
    const summaryString = JSON.stringify(summaryObj).replace(/[^\x00-\x7F]/g, "");

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSummary: summaryString })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const text = data.report as string;
      const p1Match = text.match(/(?:\(1\)|1\.|Ringkasan Utama)[\s\S]*?(?=(?:\(2\)|2\.|Temuan dan Anomali))/i);
      const p2Match = text.match(/(?:\(2\)|2\.|Temuan dan Anomali)[\s\S]*?(?=(?:\(3\)|3\.|Saran Tindakan))/i);
      const p3Match = text.match(/(?:\(3\)|3\.|Saran Tindakan)[\s\S]*/i);

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
      <div className="min-h-screen bg-gradient-to-br from-[#EFF6FF] to-[#F0FDFA] flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-200">
            <BarChart2 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[#1E3A5F] mb-4 tracking-tight">
            AI Automated Data Analyst
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium">
            Unggah file Excel/CSV data operasional, penjualan, atau akademik Anda di sini.
          </p>
        </div>

        <div 
          className="w-full max-w-2xl bg-white border-2 border-dashed border-blue-400 rounded-2xl p-16 text-center shadow-xl shadow-blue-900/5 hover:bg-blue-50/50 hover:border-blue-500 hover:scale-[1.01] transition-all cursor-pointer group mb-10 animate-in fade-in zoom-in-95 duration-500"
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
          <div className="flex justify-center mb-6 text-blue-500 group-hover:text-blue-600 transition-colors">
            <div className="bg-blue-50 p-4 rounded-full group-hover:bg-blue-100 transition-colors">
              <UploadCloud className="w-12 h-12" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#1E3A5F] mb-2">Klik atau seret file ke sini</h3>
          <p className="text-slate-500 font-medium">Mendukung: .xlsx, .xls, .csv</p>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center text-center">
            <ShieldCheck className="w-8 h-8 text-blue-500 mb-3" />
            <h4 className="font-bold text-[#1E3A5F] mb-2">Audit Data Otomatis</h4>
            <p className="text-sm text-slate-500">Deteksi dan bersihkan data kotor secara instan</p>
          </div>
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-teal-100 shadow-sm flex flex-col items-center text-center">
            <BarChart2 className="w-8 h-8 text-teal-500 mb-3" />
            <h4 className="font-bold text-[#1E3A5F] mb-2">Visualisasi Cerdas</h4>
            <p className="text-sm text-slate-500">Grafik otomatis yang menyesuaikan jenis data Anda</p>
          </div>
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center text-center">
            <FileText className="w-8 h-8 text-indigo-500 mb-3" />
            <h4 className="font-bold text-[#1E3A5F] mb-2">Laporan AI</h4>
            <p className="text-sm text-slate-500">Narasi eksekutif profesional siap cetak</p>
          </div>
        </div>
      </div>
    );
  }

  // Render Loading
  if (isParsing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-[#1E3A5F]">AI sedang membaca struktur tabel dan tipe data Anda...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 print:bg-white print:pb-0">
      
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-blue-600 tracking-tight">AI Data Analyst</span>
          </div>
          <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-bold text-blue-600 flex items-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Powered by Claude AI
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0">
        
        {/* Dashboard Header & Tabs */}
        <div className="mb-8 print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="bg-slate-200 border border-slate-300 px-5 py-2 rounded-full text-sm font-semibold text-slate-700 flex items-center shadow-inner">
              <Database className="w-4 h-4 mr-2 text-slate-500" />
              File Aktif: <span className="ml-2 text-slate-900">{fileName}</span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={exportPNG}
                className="flex items-center justify-center px-4 py-2 border-2 border-teal-500 text-teal-600 hover:bg-teal-50 font-bold rounded-xl transition-colors text-sm"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Unduh Grafik (PNG)
              </button>
              <button 
                onClick={printPDF}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/30 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Ekspor Laporan (PDF)
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex bg-white shadow-sm border border-slate-200 p-1.5 rounded-full space-x-1">
              <button 
                onClick={() => setActiveTab('audit')}
                className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
              >
                <ShieldCheck className="w-4 h-4 mr-2" /> Audit Data
              </button>
              <button 
                onClick={() => setActiveTab('visualisasi')}
                className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'visualisasi' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
              >
                <BarChart2 className="w-4 h-4 mr-2" /> Visualisasi
              </button>
              <button 
                onClick={() => setActiveTab('laporan')}
                className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'laporan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
              >
                <FileText className="w-4 h-4 mr-2" /> Laporan AI
              </button>
            </div>
          </div>
        </div>
        
        {/* TAB 1: AUDIT DATA */}
        {activeTab === 'audit' && (
          <div className="space-y-8 animate-in fade-in duration-500 print:block">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="bg-blue-50 p-3 rounded-full mb-4 text-blue-600">
                  <List className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Baris</p>
                <p className="text-4xl font-black text-[#1E3A5F]">{totalRows.toLocaleString('id-ID')}</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="bg-teal-50 p-3 rounded-full mb-4 text-teal-600">
                  <Database className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Kolom</p>
                <p className="text-4xl font-black text-[#1E3A5F]">{columns.length}</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="bg-purple-50 p-3 rounded-full mb-4 text-purple-600">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Baris Bermasalah</p>
                <p className="text-4xl font-black text-purple-600">{problematicRows.toLocaleString('id-ID')}</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="bg-green-50 p-3 rounded-full mb-4 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Kesehatan Data</p>
                <p className="text-4xl font-black text-green-500">{healthScore}%</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center">
                <ShieldCheck className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-bold text-[#1E3A5F]">Tabel Log Pemeriksaan</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-50 text-blue-900 text-sm">
                      <th className="px-6 py-4 font-bold">No</th>
                      <th className="px-6 py-4 font-bold">Nama Kolom</th>
                      <th className="px-6 py-4 font-bold">Jumlah Nilai Kosong</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.no} className="even:bg-slate-50 odd:bg-white hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-500 border-b border-slate-100">{log.no}</td>
                        <td className="px-6 py-4 text-sm font-bold text-[#1E3A5F] border-b border-slate-100">{log.namaKolom}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600 border-b border-slate-100">{log.jumlahKosong}</td>
                        <td className="px-6 py-4 border-b border-slate-100">
                          {log.status === 'Bersih' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Bersih
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Perlu Perhatian
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
            <div className="bg-blue-600 text-white rounded-2xl p-5 flex items-start shadow-md">
              <Info className="w-6 h-6 mt-0.5 mr-4 flex-shrink-0 text-blue-200" />
              {auditLogs.filter(l => l.jumlahKosong > 0).length > 0 ? (
                <p className="text-base leading-relaxed font-medium">
                  <strong className="text-white">Notifikasi AI:</strong> AI berhasil mendeteksi {auditLogs.reduce((acc, l) => acc + l.jumlahKosong, 0)} baris kosong pada kolom penting ({auditLogs.filter(l => l.jumlahKosong > 0).map(l => l.namaKolom).join(', ')}) dan telah menyesuaikannya agar grafik tetap akurat.
                </p>
              ) : (
                <p className="text-base leading-relaxed font-medium">
                  <strong className="text-white">Notifikasi AI:</strong> Struktur data Anda terlihat sangat rapi dan bersih. Tidak terdeteksi adanya data yang kosong atau rusak. AI siap memvisualisasikan data Anda secara optimal!
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VISUALISASI */}
        {activeTab === 'visualisasi' && (
          <div className="space-y-8 animate-in fade-in duration-500 print:block" ref={chartRef}>
            
            {(!visData.barData && !visData.pieData) ? (
              <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-200 text-center">
                <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#1E3A5F] mb-2">Visualisasi Tidak Tersedia</h3>
                <p className="text-slate-500 text-lg">Data tidak memiliki kolom periode atau kategori yang dapat divisualisasikan secara otomatis.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Render Bar Chart */}
                {visData.barData && visData.barXKey && (
                  <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-md border border-slate-100">
                    <div className="mb-8 border-b-2 border-blue-100 pb-4 inline-block">
                      <h3 className="text-2xl font-black text-[#1E3A5F]">
                        Distribusi Frekuensi Berdasarkan {visData.barXKey}
                      </h3>
                    </div>
                    <div className="h-[450px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visData.barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} 
                            angle={-45} 
                            textAnchor="end"
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold', color: '#1E3A5F' }} 
                          />
                          <Bar dataKey="value" name="Jumlah" fill="#2563EB" radius={[6, 6, 0, 0]}>
                            <LabelList dataKey="value" position="top" fill="#1E3A5F" fontSize={12} fontWeight="bold" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Render Pie Chart */}
                {visData.pieData && visData.pieNameKey && (
                  <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-md border border-slate-100">
                    <div className="mb-8 border-b-2 border-teal-100 pb-4 inline-block">
                      <h3 className="text-2xl font-black text-[#1E3A5F]">
                        Proporsi Distribusi Kategori ({visData.pieNameKey})
                      </h3>
                    </div>
                    <div className="h-[450px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={visData.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={90}
                            outerRadius={150}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                            label={renderCustomizedLabel}
                            labelLine={false}
                          >
                            {visData.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold', color: '#1E3A5F' }} 
                          />
                          <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontWeight: '600', color: '#475569' }} />
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
            
            {!reportParts && !isGeneratingReport && (
              <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-200 text-center print:hidden">
                <div className="bg-gradient-to-br from-blue-100 to-teal-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FileText className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-3xl font-black text-[#1E3A5F] mb-4">Laporan Eksekutif AI</h3>
                <p className="text-slate-500 mb-10 max-w-xl mx-auto text-lg">
                  AI Automated Data Analyst akan membaca metrik dan pola dari keseluruhan data Anda, lalu menyusun laporan naratif eksekutif secara instan yang siap untuk dipresentasikan.
                </p>
                <button 
                  onClick={generateReport}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-bold py-4 px-10 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-600/30 flex items-center justify-center mx-auto text-lg w-full sm:w-auto"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Generate Laporan AI
                </button>
              </div>
            )}

            {isGeneratingReport && (
              <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-200 text-center print:hidden">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-[#1E3A5F]">AI sedang menganalisis data Anda...</h3>
                <p className="text-slate-500 mt-2 text-lg">Mengekstraksi wawasan, menemukan anomali, dan merumuskan saran tindakan cerdas.</p>
              </div>
            )}

            {reportParts && !isGeneratingReport && (
              <div className="bg-transparent print:bg-white print:p-0">
                <div className="text-center mb-10 print:mb-6">
                  <h1 className="text-4xl font-black text-[#1E3A5F] uppercase tracking-wider mb-2">Laporan Eksekutif</h1>
                  <div className="inline-block bg-white shadow-sm px-6 py-2 rounded-full border border-slate-200 text-slate-500 font-medium mt-2">
                    Dihasilkan oleh AI Automated Data Analyst • {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Bagian 1 */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                    <div className="bg-blue-600 px-8 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <FileText className="w-6 h-6 mr-3 text-blue-200" /> Ringkasan Utama
                      </h2>
                    </div>
                    <div className="p-8 text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                      {reportParts.p1}
                    </div>
                  </div>

                  {/* Bagian 2 */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                    <div className="bg-amber-500 px-8 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <AlertTriangle className="w-6 h-6 mr-3 text-amber-100" /> Temuan dan Anomali
                      </h2>
                    </div>
                    <div className="p-8 text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                      {reportParts.p2}
                    </div>
                  </div>

                  {/* Bagian 3 */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                    <div className="bg-green-600 px-8 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <ShieldCheck className="w-6 h-6 mr-3 text-green-200" /> Saran Tindakan
                      </h2>
                    </div>
                    <div className="p-8 bg-green-50/30 text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                      {reportParts.p3}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Bar / Export Features */}
      {/* Ekspor dipindah ke atas */}
    </div>
  );
}
