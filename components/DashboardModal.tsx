import React, { useMemo } from 'react';
import { X, Calendar, TrendingUp, PhoneCall, CheckCircle2, FileText, PieChart, Activity, Target } from 'lucide-react';
import { Contact, ContactStatus } from '../types';
import { isToday, isThisWeek, isThisMonth } from '../utils';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
}

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose, contacts }) => {
  
  // 1. Calculate Time-based Metrics
  const metrics = useMemo(() => {
    const stats = {
      today: { calls: 0, proposals: 0, closed: 0 },
      week: { calls: 0, proposals: 0, closed: 0 },
      month: { calls: 0, proposals: 0, closed: 0 },
      totalContacts: contacts.length,
      totalClosed: 0,
    };

    contacts.forEach(contact => {
      // Global stats
      if (contact.status === ContactStatus.CLOSED) stats.totalClosed++;

      // We only care if action was taken (lastContactDate exists) for timeline stats
      if (!contact.lastContactDate) return;

      const date = contact.lastContactDate;
      const isDay = isToday(date);
      const isWeek = isThisWeek(date);
      const isMonth = isThisMonth(date);
      
      const isCall = [
        ContactStatus.NO_ANSWER, ContactStatus.ABSENT, ContactStatus.WHATSAPP_TALK, 
        ContactStatus.EMAIL_SENT, ContactStatus.RETURN_SCHEDULED, 
        ContactStatus.NOT_INTERESTED, ContactStatus.DECLINED
      ].includes(contact.status);

      const isProposal = contact.status === ContactStatus.PROPOSAL_SENT || contact.status === ContactStatus.NEGOTIATION;
      const isClosed = contact.status === ContactStatus.CLOSED;

      if (isDay) {
        if (isCall) stats.today.calls++;
        if (isProposal) stats.today.proposals++;
        if (isClosed) stats.today.closed++;
      }
      if (isWeek) {
        if (isCall) stats.week.calls++;
        if (isProposal) stats.week.proposals++;
        if (isClosed) stats.week.closed++;
      }
      if (isMonth) {
        if (isCall) stats.month.calls++;
        if (isProposal) stats.month.proposals++;
        if (isClosed) stats.month.closed++;
      }
    });

    return stats;
  }, [contacts]);

  // 2. Prepare Data for the "Activity Chart" (Last 14 Days)
  const chartData = useMemo(() => {
    const days = 14;
    const dataPoints = [];
    const now = new Date();
    
    // Create map of last 14 days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      // Reset time to compare strict dates
      d.setHours(0,0,0,0);
      
      // Count activities on this day
      let count = 0;
      contacts.forEach(c => {
        if (c.lastContactDate) {
          const cDate = new Date(c.lastContactDate);
          cDate.setHours(0,0,0,0);
          if (cDate.getTime() === d.getTime()) {
            count++;
          }
        }
      });
      dataPoints.push({ label, count });
    }
    return dataPoints;
  }, [contacts]);

  // SVG Chart Helper
  const renderAreaChart = () => {
    const data = chartData.map(d => d.count);
    const max = Math.max(...data, 5); // Minimum scale of 5
    const width = 100; // viewBox units
    const height = 40; // viewBox units
    
    // Generate SVG path
    let pathD = `M0,${height} `; // Start at bottom left
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val / max) * height);
      return `${x},${y}`;
    });

    // Line Path
    const linePath = `M${points[0]} ` + points.slice(1).map(p => `L${p}`).join(' ');
    
    // Fill Area Path (Close the loop)
    const areaPath = linePath + ` L${width},${height} L0,${height} Z`;

    return (
      <div className="w-full h-32 relative group">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
             <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
               <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
             </linearGradient>
          </defs>
          {/* Area Fill */}
          <path d={areaPath} fill="url(#gradient)" className="transition-all duration-500 ease-in-out" />
          {/* Stroke Line */}
          <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="drop-shadow-sm" />
          
          {/* Points */}
          {points.map((p, i) => {
             const [cx, cy] = p.split(',');
             return (
               <g key={i} className="group-hover:opacity-100 opacity-0 transition-opacity duration-200">
                  <circle cx={cx} cy={cy} r="1.5" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
                  {/* Tooltip logic simplified via CSS/Layout */}
               </g>
             );
          })}
        </svg>
        
        {/* Simple X-Axis Labels */}
        <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-mono">
           <span>{chartData[0].label}</span>
           <span>{chartData[Math.floor(chartData.length/2)].label}</span>
           <span>{chartData[chartData.length-1].label}</span>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const conversionRate = metrics.totalContacts > 0 
    ? Math.round((metrics.totalClosed / metrics.totalContacts) * 100) 
    : 0;

  const MetricRow = ({ label, valToday, valWeek, valMonth, icon: Icon, color }: any) => (
    <div className="grid grid-cols-4 items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors rounded-lg px-2">
      <div className="flex items-center gap-2 text-gray-600 font-medium text-xs col-span-1">
        <div className={`p-1.5 rounded-md ${color} bg-opacity-10 text-opacity-100`}>
          <Icon className={`w-3.5 h-3.5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{label.split(' ')[0]}</span>
      </div>
      <div className="text-center font-bold text-gray-800">{valToday}</div>
      <div className="text-center font-bold text-gray-800">{valWeek}</div>
      <div className="text-center font-bold text-gray-800 text-lg">{valMonth}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden border border-white/20">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
               <h2 className="text-2xl font-bold flex items-center gap-2">
                 <Activity className="w-6 h-6" /> Dashboard Premium
               </h2>
               <p className="text-indigo-100 text-sm mt-1 opacity-90">Análise detalhada de produtividade e conversão.</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold">Total Contatos</p>
                <p className="text-2xl font-bold mt-1">{metrics.totalContacts}</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold">Fechamentos</p>
                <p className="text-2xl font-bold mt-1">{metrics.totalClosed}</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 col-span-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold">Taxa de Conversão</p>
                    <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
                  </div>
                  <Target className="w-8 h-8 text-indigo-300 opacity-50 mb-1" />
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
                   <div className="bg-green-400 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(conversionRate, 100)}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-6 space-y-6">

            {/* CHART SECTION */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-gray-800 font-bold flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-violet-500" /> Atividade (Últimos 14 dias)
                   </h3>
                   <p className="text-xs text-gray-500 mt-0.5">Volume de contatos trabalhados por dia</p>
                 </div>
                 <div className="text-right">
                    <span className="text-2xl font-bold text-violet-600">
                      {chartData.reduce((acc, curr) => acc + curr.count, 0)}
                    </span>
                    <span className="text-xs text-gray-400 block uppercase">Ações no período</span>
                 </div>
               </div>
               
               {/* Render SVG Chart */}
               {renderAreaChart()}
            </div>

            {/* DETAILED TABLE SECTION */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-gray-500" /> Detalhamento por Período
                  </h3>
               </div>
               
               <div className="p-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                     <div className="col-span-1">Métrica</div>
                     <div className="text-center">Hoje</div>
                     <div className="text-center">Semana</div>
                     <div className="text-center text-violet-600">Mês</div>
                  </div>

                  <MetricRow 
                    label="Tentativas / Contatos" 
                    icon={PhoneCall} 
                    color="bg-blue-500"
                    valToday={metrics.today.calls}
                    valWeek={metrics.week.calls}
                    valMonth={metrics.month.calls}
                  />
                  
                  <MetricRow 
                    label="Propostas / Negoc." 
                    icon={FileText} 
                    color="bg-pink-500"
                    valToday={metrics.today.proposals}
                    valWeek={metrics.week.proposals}
                    valMonth={metrics.month.proposals}
                  />

                  <MetricRow 
                    label="Fechamentos Realizados" 
                    icon={CheckCircle2} 
                    color="bg-green-500"
                    valToday={metrics.today.closed}
                    valWeek={metrics.week.closed}
                    valMonth={metrics.month.closed}
                  />
               </div>
               <div className="bg-blue-50/50 p-3 text-center text-xs text-blue-800 font-medium">
                  💡 Dica: Mantenha a consistência diária para aumentar a linha de tendência!
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardModal;