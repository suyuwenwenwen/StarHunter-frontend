"use client";
import { useState, FormEvent, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// ==========================================
// 全局 API 地址配置 (支持本地与云端部署)
// ==========================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ==========================================
// 极简单色 SVG 图标库
// ==========================================
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>;

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'c_input' | 'c_workspace' | 'b_input' | 'b_workspace'>('landing');
  const [jd, setJd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [resumeData, setResumeData] = useState<any>({});
  const [pdfBase64, setPdfBase64] = useState("");
  const [input, setInput] = useState("");
  const [cFileName, setCFileName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [bFiles, setBFiles] = useState<File[]>([]);
  const [bCandidates, setBCandidates] = useState<any[]>([]);

  useEffect(() => {
    if (currentView === 'c_workspace') messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentView]);

  const handleCFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setCFileName(file.name);
    setIsLoading(true); setStatusText("正在解析简历框架...");
    const formData = new FormData(); formData.append("file", file);
    try {
      // ✅ 使用了动态 API_BASE
      const res = await fetch(`${API_BASE}/api/extract`, { method: "POST", body: formData });
      const { data } = await res.json();
      setResumeData(data); setStatusText("正在生成基础排版..."); await compilePdf(data);
    } catch (err) { console.error(err); }
    setIsLoading(false); setStatusText("");
  };

  const startCDiagnose = async () => {
    if (!jd || Object.keys(resumeData).length === 0) return;
    setCurrentView('c_workspace');
    setIsLoading(true); setStatusText("AI 导师正在进行深度阅卷...");
    try {
      // ✅ 使用了动态 API_BASE
      const res = await fetch(`${API_BASE}/api/diagnose`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], resume_data: resumeData, jd_input: jd })
      });
      const data = await res.json(); setMessages([{ role: "assistant", content: data.reply }]);
    } catch (err) { console.error(err); }
    setIsLoading(false); setStatusText("");
  };

  const compilePdf = async (data: any) => {
    try {
      // ✅ 使用了动态 API_BASE
      const res = await fetch(`${API_BASE}/api/compile`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resume_data: data })
      });
      const { pdf_base64 } = await res.json(); setPdfBase64(pdf_base64);
    } catch (err) { console.error(err); }
  };

  const sendCMessage = async (e: FormEvent) => {
    e.preventDefault(); if (!input.trim()) return;
    const newMsgs = [...messages, { role: "user", content: input }];
    setMessages(newMsgs); setInput("");
    setIsLoading(true); setStatusText("正在注入策略并重绘排版...");
    try {
      // ✅ 使用了动态 API_BASE
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, resume_data: resumeData, jd_input: jd })
      });
      const data = await res.json(); setMessages([...newMsgs, { role: "assistant", content: data.reply }]);
      if (data.updated_fields && Object.keys(data.updated_fields).length > 0) {
        const newData = { ...resumeData, ...data.updated_fields };
        setResumeData(newData); await compilePdf(newData);
      }
    } catch (err) { console.error(err); }
    setIsLoading(false); setStatusText("");
  };

  const handleBFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setBFiles(Array.from(e.target.files));
  };

  const startBEvaluate = async () => {
    if (!jd || bFiles.length === 0) return;
    setCurrentView('b_workspace');
    setIsLoading(true); setStatusText(`正在多维评估 ${bFiles.length} 份候选人简历...`);
    const formData = new FormData(); formData.append("jd", jd);
    bFiles.forEach(file => formData.append("files", file));
    try {
      // ✅ 使用了动态 API_BASE
      const res = await fetch(`${API_BASE}/api/hr/batch-evaluate`, { method: "POST", body: formData });
      const data = await res.json(); setBCandidates(data.candidates);
    } catch (err) { console.error(err); }
    setIsLoading(false); setStatusText("");
  };

  if (currentView === 'landing') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden bg-[var(--bg-app)] py-20">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[var(--primary)]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="z-10 text-center mb-16 mt-8">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-[var(--primary)] mb-4">StarHunter.</h1>
          <p className="text-xl md:text-2xl text-[var(--text-muted)] font-medium tracking-wide">基于大模型的双向简历评估系统</p>
        </div>
        <div className="z-10 flex flex-col md:flex-row gap-6 w-full max-w-4xl px-6">
          <button onClick={() => setCurrentView('c_input')} className="flex-1 text-left p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] hover:border-[var(--primary)]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-6 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors"><UserIcon /></div>
            <h2 className="text-2xl font-bold mb-2">求职者工作台</h2>
            <p className="text-[var(--text-muted)]">智能诊断与极速排版<br/>重塑你的职场第一张名片</p>
          </button>
          <button onClick={() => setCurrentView('b_input')} className="flex-1 text-left p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)] hover:border-[var(--primary)]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-6 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors"><BriefcaseIcon /></div>
            <h2 className="text-2xl font-bold mb-2">HR 筛选中心</h2>
            <p className="text-[var(--text-muted)]">简历批量导入与解析<br/>根据岗位 JD 自动量化打分</p>
          </button>
        </div>
      </main>
    );
  }

  if (currentView === 'c_input' || currentView === 'b_input') {
    const isB = currentView === 'b_input';
    return (
      <main className="min-h-screen flex flex-col items-center justify-center relative bg-[var(--bg-app)] px-6 py-20 overflow-x-hidden">
        <button onClick={() => setCurrentView('landing')} className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors z-20"><BackIcon /> 返回首页</button>
        <div className="w-full max-w-3xl z-10 flex flex-col gap-8">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">{isB ? "B端：企业批量筛选引擎" : "C端：配置求职诊断环境"}</h1>
            <p className="text-lg text-[var(--text-muted)]">{isB ? "输入招聘 JD，并批量上传候选人简历，系统将自动进行量化评估。" : "输入目标 JD 并上传您的原版简历，唤醒 StarHunter 精修引擎。"}</p>
          </div>
          <div className="bg-[var(--surface)] p-8 rounded-3xl shadow-sm border border-[var(--border-color)] flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{isB ? "Enterprise JD" : "Target Job Description"}</label>
              <textarea className="w-full p-5 rounded-xl border border-[var(--border-color)] bg-transparent focus:bg-gray-50 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all resize-none text-base leading-relaxed" rows={6} placeholder="在此粘贴目标岗位的职责与要求..." value={jd} onChange={(e) => setJd(e.target.value)} />
            </div>
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isB ? "Candidate Resumes (Batch PDF)" : "Source Resume (Single PDF)"}</label>
              <label className="w-full flex flex-col items-center justify-center gap-4 p-10 rounded-xl border-2 border-dashed border-gray-200 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 cursor-pointer transition-all bg-gray-50">
                <div className="p-4 bg-[var(--surface)] shadow-sm rounded-full text-[var(--text-main)]">{isB ? <BriefcaseIcon/> : <UploadIcon/>}</div>
                <span className="text-base font-medium text-[var(--text-main)] text-center">
                  {isB ? (bFiles.length > 0 ? `已成功挂载 ${bFiles.length} 份候选人简历` : "点击批量选择多个候选人 PDF 简历") : (cFileName ? `已加载：${cFileName}` : "点击或拖拽上传一份 PDF 简历")}
                </span>
                <input type="file" accept="application/pdf" multiple={isB} className="hidden" onChange={isB ? handleBFileUpload : handleCFileUpload} />
              </label>
            </div>
            <button onClick={isB ? startBEvaluate : startCDiagnose} disabled={!jd || (isB ? bFiles.length === 0 : Object.keys(resumeData).length === 0) || isLoading} className={`mt-2 w-full flex items-center justify-center gap-2 py-4 text-white text-lg font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${isB ? 'bg-gray-900 shadow-black/10' : 'bg-[var(--primary)] shadow-[var(--primary)]/20'}`}>
              {isLoading ? <span className="animate-pulse">{statusText}</span> : <>{isB ? <BriefcaseIcon /> : <SparkleIcon />} {isB ? "开启多维批量评估" : "开启深度诊断"}</>}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (currentView === 'b_workspace') {
    return (
      <main className="h-screen flex flex-col bg-[#f8f9fa] overflow-hidden">
        <header className="flex-none h-16 border-b border-[var(--border-color)] bg-[var(--surface)] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('landing')} className="font-bold text-xl tracking-tight text-gray-900">StarHunter <span className="font-normal text-gray-400">| HR Portal</span></button>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
              <span className="px-3 py-1.5 bg-gray-100 rounded-md">评估池: {bFiles.length} 人</span>
            </div>
          </div>
          <button onClick={() => setCurrentView('b_input')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">重新导入批次</button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="w-full">
            <div className="mb-8 pl-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">智能人才匹配池</h1>
              <p className="text-base text-gray-500">基于最新 JD 深度扫描。高匹配度候选人已为您置顶排序。</p>
            </div>

            {isLoading ? (
              <div className="w-full flex flex-col items-center justify-center py-20 opacity-50">
                <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mb-4"></div>
                <p className="font-medium text-lg text-gray-600 animate-pulse">{statusText}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {bCandidates.map((candidate, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{candidate.name}</h2>
                        <p className="text-sm text-gray-400 font-mono">{candidate.filename}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-5xl font-black ${candidate.score >= 80 ? 'text-[var(--primary)]' : candidate.score >= 60 ? 'text-gray-600' : 'text-red-500'}`}>
                          {candidate.score}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mt-1">Match Score</span>
                      </div>
                    </div>
                    
                    <div className="mb-8 pb-6 border-b border-gray-100">
                      <p className="text-base font-medium text-gray-700 leading-relaxed">
                        “{candidate.summary}”
                      </p>
                    </div>

                    {candidate.dimensions && candidate.dimensions.length > 0 && (
                      <div className="mb-8 pb-6 border-b border-gray-100">
                        <div className="text-sm font-bold text-gray-400 mb-5 uppercase tracking-wider">能力雷达拆解</div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                          {candidate.dimensions.map((dim: any, dIdx: number) => {
                            const maxScore = parseInt(dim.weight.replace(/\D/g, '')) || 100;
                            const percent = Math.min(100, Math.max(0, (dim.score / maxScore) * 100));
                            return (
                              <div key={dIdx} className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                                  <span className="truncate pr-2">{dim.name}</span>
                                  <span className="text-gray-900 font-bold">{dim.score} <span className="text-gray-400 font-normal">/ {maxScore}</span></span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--primary)]/70 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-6 mt-auto">
                      <div className="bg-[var(--primary)]/5 rounded-xl p-6 border border-[var(--primary)]/10">
                        <div className="flex items-center gap-2 mb-4 text-[var(--primary)] font-bold text-sm uppercase tracking-widest">
                          <PlusIcon /> 核心加分项
                        </div>
                        <ul className="space-y-3">
                          {candidate.pros?.map((pro: string, i: number) => (
                            <li key={i} className="text-base text-gray-700 leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-[var(--primary)] before:rounded-full">
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {candidate.deductions && candidate.deductions.length > 0 && (
                        <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
                          <div className="flex items-center gap-2 mb-4 text-red-600 font-bold text-sm uppercase tracking-widest">
                            <MinusIcon /> 核心减分明细
                          </div>
                          <div className="flex flex-col gap-3">
                            {candidate.deductions.map((deduction: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 bg-white border border-red-100 p-3.5 rounded-lg shadow-sm">
                                <span className="bg-red-500 text-white text-sm font-black px-3 py-1 rounded shrink-0 shadow-sm mt-0.5">
                                  {deduction.minus}分
                                </span>
                                <span className="text-base text-red-900 font-medium leading-relaxed">
                                  {deduction.detail}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-[var(--bg-app)] overflow-hidden">
      <header className="flex-none h-16 border-b border-[var(--border-color)] bg-[var(--surface)] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentView('landing')} className="font-bold text-xl tracking-tight text-[var(--primary)]">StarHunter.</button>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 rounded-md">JD 已锁定</span>
            <span className="truncate max-w-[200px]">源文件: {cFileName}</span>
          </div>
        </div>
        <button onClick={() => setCurrentView('c_input')} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">重新配置环境</button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <section className="w-full md:w-1/2 flex flex-col bg-[var(--bg-app)] border-r border-[var(--border-color)]">
          <div className="p-4 bg-[var(--surface)] border-b border-[var(--border-color)] shrink-0">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Diagnostics Console</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-20">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'assistant' && <span className="text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-widest flex items-center gap-1"><SparkleIcon/> AI Mentor</span>}
                <div className={`max-w-[95%] p-6 rounded-2xl ${msg.role === 'user' ? 'bg-gray-200 text-[var(--text-main)] rounded-br-sm' : 'bg-[var(--surface)] text-[var(--text-main)] border shadow-sm rounded-tl-sm'}`}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap font-sans text-base leading-relaxed">{msg.content}</div>
                  ) : (
                    <ReactMarkdown 
                      components={{
                        h3: ({node, ...props}) => <h3 className="text-base font-bold text-[var(--primary)] mt-6 mb-3 uppercase tracking-widest" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-[var(--text-main)] text-base leading-loose" {...props} />,
                        ul: ({node, ...props}) => <ul className="mb-4 space-y-3" {...props} />,
                        li: ({node, ...props}) => <li className="flex items-start before:content-['•'] before:text-[var(--primary)] before:mr-3 before:text-lg before:font-bold text-base leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-black" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--primary)]/30 bg-[var(--primary)]/5 pl-4 py-3 pr-3 rounded-r-md text-[var(--text-muted)] italic my-4 text-base" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-base font-medium text-[var(--primary)] animate-pulse p-4"><SparkleIcon /> {statusText}</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendCMessage} className="shrink-0 p-4 bg-[var(--surface)] border-t border-[var(--border-color)]">
            <div className="relative flex items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} placeholder="输入补充细节或选择风格..." className="w-full p-4 pr-16 rounded-xl border border-[var(--border-color)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all text-base" />
              <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 w-12 h-12 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"><SendIcon /></button>
            </div>
          </form>
        </section>

        <section className="hidden md:flex md:w-1/2 flex-col bg-[#eceeef] relative p-4">
           <div className="absolute top-6 right-8 z-10">
            {pdfBase64 && (
              <a href={`data:application/pdf;base64,${pdfBase64}`} download="StarHunter_Resume.pdf" className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 bg-white/90 backdrop-blur border shadow-md hover:bg-white text-[var(--text-main)] rounded-full transition-all">
                <DownloadIcon /> 导出终稿
              </a>
            )}
           </div>
           <div className="flex-1 w-full h-full bg-white shadow-2xl shadow-black/10 border border-gray-200 rounded-2xl overflow-hidden relative">
             {pdfBase64 ? (
               <iframe src={`data:application/pdf;base64,${pdfBase64}#view=Fit&toolbar=0&navpanes=0`} className="absolute inset-0 w-full h-full border-none" />
             ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-50">
                 <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg mb-4"></div>
                 <p className="text-base font-medium">等待 PDF 渲染...</p>
               </div>
             )}
           </div>
        </section>
      </div>
    </main>
  );
}
