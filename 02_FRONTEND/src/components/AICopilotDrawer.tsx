import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Trash2,
  ArrowRight,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { NavTab } from './Sidebar';
import { MarkdownView } from './MarkdownView';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedActions?: string[];
  source?: string;
  time: string;
}

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  userRole?: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  userRole
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '### 👋 ¡Hola! Soy tu Copiloto Inteligente de ERP TechStore\n\nPuedo responder preguntas sobre tus ventas, estado de inventario, stock crítico, cobranzas y balances financieros en tiempo real.\n\n¿En qué te puedo ayudar hoy?',
      suggestedActions: ['Ver Resumen Ejecutivo', 'Stock Crítico', 'Top Ventas'],
      source: 'analyst_engine',
      time: 'Ahora'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      api.getAIStatus().then(status => setAiStatus(status)).catch(() => {});
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const response = await api.chatCopilot(text);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.reply,
        suggestedActions: response.suggested_actions || [],
        source: response.source,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `### ❌ No se pudo completar la consulta\n\n${err.message || 'Error al conectar con el servicio de IA.'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action: string) => {
    const actLower = action.toLowerCase();
    if (actLower.includes('inventario') || actLower.includes('stock')) {
      onNavigateTab('inventario');
    } else if (actLower.includes('compra')) {
      onNavigateTab('compras');
    } else if (actLower.includes('venta')) {
      onNavigateTab('ventas');
    } else if (actLower.includes('finanza') || actLower.includes('cobr')) {
      onNavigateTab('finanzas');
    } else if (actLower.includes('cliente')) {
      onNavigateTab('clientes');
    } else if (actLower.includes('proveedor')) {
      onNavigateTab('proveedores');
    } else {
      // Si es una pregunta sugerida, enviarla como consulta
      handleSend(action);
    }
  };

  const quickPrompts = [
    { label: 'Stock Crítico', icon: Package, query: '¿Cuáles son los productos con stock crítico?' },
    { label: 'Top Ventas', icon: TrendingUp, query: '¿Cuáles son los 5 productos más vendidos?' },
    { label: 'Cuentas Pendientes', icon: DollarSign, query: '¿Cuánto dinero tenemos por cobrar vs por pagar?' },
    { label: 'Resumen General', icon: BarChart3, query: 'Dame un resumen ejecutivo general de la empresa' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-transform duration-300">
        
        {/* Header con gradiente dinámico */}
        <div className="p-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base leading-tight">Copiloto IA TechStore</h2>
                <span className="text-[10px] font-semibold uppercase bg-white/20 border border-white/30 px-2 py-0.5 rounded-full">
                  ERP AI
                </span>
              </div>
              <p className="text-xs text-violet-100 flex items-center gap-1.5 mt-0.5">
                <Cpu className="w-3 h-3 inline" />
                {aiStatus?.has_gemini
                  ? 'Google Gemini 1.5 Flash Conectado'
                  : 'Motor Analítico Local (Reglas & Heurística)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMessages([messages[0]])}
              title="Limpiar chat"
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(qp.query)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs whitespace-nowrap transition-all cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-2xs transition-all ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div>
                    <MarkdownView content={msg.text} />

                    {/* Acciones sugeridas */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleActionClick(action)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                          >
                            <span>{action}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Metadata footer */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{msg.time}</span>
                      {msg.source && (
                        <span className="capitalize font-mono">
                          {msg.source === 'gemini' ? '✨ Gemini AI' : '⚙️ Analítica Local'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span>Analizando datos del ERP y procesando respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Haz una pregunta sobre ventas, stock o finanzas..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 py-1.5"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || loading}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                inputValue.trim() && !loading
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs hover:opacity-90'
                  : 'text-slate-400 bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2">
            Respuestas basadas en datos vivos de PostgreSQL / SQLite de tu ERP EnterpriseCloud.
          </p>
        </div>

      </div>
    </div>
  );
};
