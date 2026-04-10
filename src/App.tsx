/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Briefcase, 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Info,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Types ---

interface Witness {
  id: string;
  name: string;
}

interface FormData {
  companyName: string;
  companyId: string;
  employeeName: string;
  employeeId: string;
  employeeRole: string;
  warningLevel: 'Leve' | 'Média' | 'Grave';
  managerName: string;
  managerRole: string;
  occurrenceDate: string;
  occurrenceTime: string;
  hasTime: boolean;
  description: string;
  witnesses: Witness[];
}

type Step = 'form' | 'processing' | 'result';

// --- Components ---

const InputGroup = ({ label, icon: Icon, children }: { label: string, icon: any, children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
      <Icon size={12} />
      {label}
    </label>
    {children}
  </div>
);

export default function App() {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companyId: '',
    employeeName: '',
    employeeId: '',
    employeeRole: '',
    warningLevel: 'Leve',
    managerName: '',
    managerRole: '',
    occurrenceDate: new Date().toISOString().split('T')[0],
    occurrenceTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    hasTime: true,
    description: '',
    witnesses: [{ id: Math.random().toString(36).substr(2, 9), name: '' }]
  });

  const docRef = useRef<HTMLDivElement>(null);

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === 'employeeId') {
      newValue = formatCPF(value);
    } else if (name === 'companyId') {
      newValue = formatCNPJ(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleWitnessChange = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.map(w => w.id === id ? { ...w, name } : w)
    }));
  };

  const addWitness = () => {
    if (formData.witnesses.length >= 2) return; // Limit to 2 witnesses to save space
    setFormData(prev => ({
      ...prev,
      witnesses: [...prev.witnesses, { id: Math.random().toString(36).substr(2, 9), name: '' }]
    }));
  };

  const removeWitness = (id: string) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter(w => w.id !== id)
    }));
  };

  const handleReset = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setFormData({
      companyName: '',
      companyId: '',
      employeeName: '',
      employeeId: '',
      employeeRole: '',
      warningLevel: 'Leve',
      managerName: '',
      managerRole: '',
      occurrenceDate: now.toISOString().split('T')[0],
      occurrenceTime: `${hours}:${minutes}`,
      hasTime: true,
      description: '',
      witnesses: [{ id: Math.random().toString(36).substr(2, 9), name: '' }]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => {
      setStep('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current) return;

    const toast = document.createElement('div');
    toast.className = "fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-medium animate-bounce";
    toast.innerHTML = `<div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Gerando PDF...`;
    document.body.appendChild(toast);

    try {
      // Use a fixed width for capture to ensure A4 proportions
      const canvas = await html2canvas(docRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in px at 96dpi
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Since we limited the text, it should always fit in one page
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      const fileName = `advertencia_${formData.employeeName.toLowerCase().replace(/\s+/g, '_') || 'colaborador'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      document.body.removeChild(toast);
    }
  };

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
  };

  const todayLong = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      {/* Header - Hidden on Print */}
      <header className="bg-slate-900 text-white py-12 px-6 text-center shadow-lg print:hidden">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight">
            Gerador de Advertência Profissional
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto font-light text-lg">
            Formalize medidas disciplinares internas com um layout profissional pronto para impressão e PDF.
          </p>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 print:hidden"
            >
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Section: Company */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Briefcase className="text-slate-900" size={20} />
                      <h2 className="text-xl font-serif font-bold text-slate-900">Dados da Empresa</h2>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleReset}
                      className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1.5 transition-colors group"
                    >
                      <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
                      Limpar Tudo
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Nome da Empresa" icon={Briefcase}>
                      <input
                        type="text"
                        name="companyName"
                        required
                        placeholder="Ex: Empresa de Serviços LTDA"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                    <InputGroup label="CNPJ da Empresa" icon={FileText}>
                      <input
                        type="text"
                        name="companyId"
                        required
                        maxLength={18}
                        placeholder="00.000.000/0000-00"
                        value={formData.companyId}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                  </div>
                </div>

                {/* Section: Employee */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <User className="text-slate-900" size={20} />
                    <h2 className="text-xl font-serif font-bold text-slate-900">Dados do Colaborador</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Nome Completo" icon={User}>
                      <input
                        type="text"
                        name="employeeName"
                        required
                        placeholder="Ex: João da Silva"
                        value={formData.employeeName}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                    <InputGroup label="CPF" icon={FileText}>
                      <input
                        type="text"
                        name="employeeId"
                        required
                        maxLength={14}
                        placeholder="000.000.000-00"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                    <InputGroup label="Cargo" icon={Briefcase}>
                      <input
                        type="text"
                        name="employeeRole"
                        required
                        placeholder="Ex: Atendente / Auxiliar"
                        value={formData.employeeRole}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                    <InputGroup label="Grau da Advertência" icon={AlertCircle}>
                      <select
                        name="warningLevel"
                        value={formData.warningLevel}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Leve">Leve</option>
                        <option value="Média">Média</option>
                        <option value="Grave">Grave</option>
                      </select>
                    </InputGroup>
                  </div>
                </div>

                {/* Section: Manager */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <Users className="text-slate-900" size={20} />
                    <h2 className="text-xl font-serif font-bold text-slate-900">Dados do Gestor</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Nome do Gestor" icon={User}>
                      <input
                        type="text"
                        name="managerName"
                        required
                        placeholder="Ex: Maria Souza"
                        value={formData.managerName}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                    <InputGroup label="Cargo do Gestor" icon={Briefcase}>
                      <input
                        type="text"
                        name="managerRole"
                        required
                        placeholder="Ex: Gerente / Supervisor"
                        value={formData.managerRole}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                  </div>
                </div>

                {/* Section: Occurrence */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <Calendar className="text-slate-900" size={20} />
                    <h2 className="text-xl font-serif font-bold text-slate-900">Ocorrência</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Data" icon={Calendar}>
                      <input
                        type="date"
                        name="occurrenceDate"
                        required
                        value={formData.occurrenceDate}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                      />
                    </InputGroup>
                    <InputGroup label="Hora" icon={Clock}>
                      <div className="space-y-2">
                        <input
                          type="time"
                          name="occurrenceTime"
                          value={formData.occurrenceTime}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="hasTime"
                            checked={formData.hasTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, hasTime: e.target.checked }))}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <span className="text-xs text-slate-500">Incluir horário no documento</span>
                        </label>
                      </div>
                    </InputGroup>
                  </div>
                  <InputGroup label="Descrição do Ocorrido" icon={FileText}>
                    <div className="relative">
                      <textarea
                        name="description"
                        required
                        maxLength={600}
                        placeholder="Descreva o ocorrido com clareza. Ex: atrasos recorrentes, descumprimento de procedimentos, etc."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all min-h-[120px] resize-y"
                      />
                      <div className={`absolute bottom-3 right-3 text-[10px] font-bold ${formData.description.length > 550 ? 'text-red-500' : 'text-slate-400'}`}>
                        {formData.description.length} / 600
                      </div>
                    </div>
                  </InputGroup>
                </div>

                {/* Section: Witnesses */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <Users className="text-slate-900" size={20} />
                    <h2 className="text-xl font-serif font-bold text-slate-900">Testemunhas (Opcional)</h2>
                  </div>
                  <div className="space-y-3">
                    {formData.witnesses.map((witness, index) => (
                      <div key={witness.id} className="flex gap-3 items-center">
                        <input
                          type="text"
                          placeholder={`Nome da Testemunha ${index + 1}`}
                          value={witness.name}
                          onChange={(e) => handleWitnessChange(witness.id, e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeWitness(witness.id)}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {formData.witnesses.length < 2 && (
                    <button
                      type="button"
                      onClick={addWitness}
                      className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 transition-colors"
                    >
                      <Plus size={16} />
                      Adicionar Testemunha
                    </button>
                  )}
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-3"
                  >
                    Gerar Documento
                    <ArrowLeft className="rotate-180" size={20} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center space-y-6"
            >
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-slate-900">Gerando Documento...</h2>
                <p className="text-slate-500">Preparando layout em padrão A4, pronto para PDF.</p>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Result Controls - Hidden on Print */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 font-bold">
                    <CheckCircle2 size={20} />
                    Documento Pronto
                  </div>
                  <p className="text-slate-500 text-sm">O documento abaixo já está formatado em página única A4.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    Voltar
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                  >
                    <Download size={18} />
                    Baixar PDF
                  </button>
                </div>
              </div>

              {/* Document Preview Shell */}
              <div className="bg-slate-200 rounded-[32px] p-4 md:p-12 overflow-x-auto shadow-inner print:p-0 print:bg-white print:shadow-none">
                <div 
                  ref={docRef}
                  className="doc-container w-[210mm] min-h-[297mm] bg-white mx-auto p-[20mm] shadow-2xl print:shadow-none print:w-full print:min-h-0"
                  style={{ fontFamily: '"Times New Roman", Times, Georgia, serif', color: '#0f172a', fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}
                >
                  {/* Document Header */}
                  <div className="text-center border-b-2 border-[#0f172a] pb-4 mb-6">
                    <h2 className="text-xl font-black uppercase tracking-[0.2em] text-[#0f172a] mb-1">
                      Comunicado de Advertência
                    </h2>
                    <p className="text-[#64748b] italic text-[10px]">Documento Disciplinar Interno</p>
                  </div>

                  {/* Document Body */}
                  <div className="space-y-4 text-[10pt] leading-relaxed text-[#0f172a]">
                    <div className="space-y-0.5 pb-2 border-b border-[#f1f5f9] mb-2">
                      <p><strong>EMPRESA:</strong> {formData.companyName}</p>
                      <p><strong>CNPJ:</strong> {formData.companyId}</p>
                    </div>

                    <div className="space-y-0.5">
                      <p><strong>PARA:</strong> {formData.employeeName}</p>
                      <p><strong>CPF:</strong> {formData.employeeId}</p>
                      <p><strong>Cargo:</strong> {formData.employeeRole}</p>
                    </div>

                    <p className="pt-2">Prezado(a) Colaborador(a),</p>

                    <p>
                      Vimos por meio desta aplicar-lhe a presente <strong>ADVERTÊNCIA DISCIPLINAR ({formData.warningLevel.toUpperCase()})</strong>, 
                      em virtude do fato ocorrido em <strong>{formatDateLong(formData.occurrenceDate)}{formData.hasTime && formData.occurrenceTime ? `, por volta das ${formData.occurrenceTime}` : ''}</strong>.
                    </p>

                    <div className="bg-[#f8fafc] border-l-4 border-[#0f172a] p-4 rounded-r-xl italic text-[#334155] whitespace-pre-wrap break-words text-[9.5pt]">
                      "{formData.description}"
                    </div>

                    <p>
                      Ressaltamos que tal conduta infringe as normas internas da empresa e as obrigações contratuais assumidas. 
                      Solicitamos que tais fatos não se repitam, sob pena de serem aplicadas medidas disciplinares mais severas, 
                      inclusive a rescisão do contrato de trabalho por justa causa, conforme preceitua o Artigo 482 da Consolidação das Leis do Trabalho (CLT).
                    </p>

                    <div className="flex justify-between items-end pt-2">
                      <div>
                        <p>Atenciosamente,</p>
                        <p className="font-bold">{todayLong}</p>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-4 grid grid-cols-2 gap-12">
                      <div className="text-center space-y-2">
                        <div className="h-10"></div>
                        <div className="border-t border-[#94a3b8] pt-2">
                          <p className="text-[9pt] font-black uppercase tracking-wider text-[#0f172a]">{formData.managerName}</p>
                          <p className="text-[7.5pt] text-[#64748b] uppercase tracking-widest">{formData.managerRole}</p>
                          <p className="text-[6.5pt] text-[#94a3b8] mt-0.5">Assinatura do Gestor</p>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="h-10"></div>
                        <div className="border-t border-[#94a3b8] pt-2">
                          <p className="text-[9pt] font-black uppercase tracking-wider text-[#0f172a]">{formData.employeeName}</p>
                          <p className="text-[7.5pt] text-[#64748b] uppercase tracking-widest">Colaborador(a)</p>
                          <p className="text-[6.5pt] text-[#94a3b8] mt-0.5">Assinatura do Colaborador</p>
                        </div>
                      </div>
                    </div>

                    {/* Witnesses */}
                    {formData.witnesses.some(w => w.name.trim()) && (
                      <div className="pt-4 space-y-4">
                        <p className="text-[7.5pt] font-black uppercase tracking-widest text-[#94a3b8] text-center">
                          Testemunhas (em caso de recusa de assinatura)
                        </p>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                          {formData.witnesses.filter(w => w.name.trim()).map((witness, idx) => (
                            <div key={witness.id} className="text-center space-y-2">
                              <div className="h-10"></div>
                              <div className="border-t border-[#94a3b8] pt-2">
                                <p className="text-[8.5pt] font-bold text-[#0f172a]">{witness.name}</p>
                                <p className="text-[6.5pt] text-[#94a3b8] mt-0.5">Testemunha {idx + 1}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .min-h-screen { min-height: 0 !important; background: white !important; }
          main { padding: 0 !important; max-width: none !important; margin: 0 !important; }
          .doc-container { 
            box-shadow: none !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            width: 100% !important;
            height: auto !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}} />
    </div>
  );
}
