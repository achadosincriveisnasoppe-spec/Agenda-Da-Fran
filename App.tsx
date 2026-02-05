import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Search, PhoneIncoming, Download, List, LayoutGrid, ArrowLeft, Settings, LayoutDashboard, FileSpreadsheet, Package } from 'lucide-react';
import { Contact, ContactStatus, DEFAULT_COLUMNS, ColumnType } from './types';
import { loadContacts, saveContacts, isToday, exportContactsToExcel, loadColumnsConfig, saveColumnsConfig } from './utils';
import Card from './components/Card';
import ContactModal from './components/ContactModal';
import ImportButton from './components/ImportButton';
import SidebarList from './components/SidebarList';
import SettingsModal from './components/SettingsModal';
import DashboardModal from './components/DashboardModal';

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [columnsConfig, setColumnsConfig] = useState<ColumnType[]>(DEFAULT_COLUMNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RETURNS_TODAY'>('ALL');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    setContacts(loadContacts());
    setColumnsConfig(loadColumnsConfig());
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Logic
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // 1. Text Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.organization.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.scope.toLowerCase().includes(q)
      );
    }

    // 2. Quick Filters
    if (activeFilter === 'RETURNS_TODAY') {
      result = result.filter(c => c.status === ContactStatus.RETURN_SCHEDULED && isToday(c.reminderDate));
    }

    return result;
  }, [contacts, searchQuery, activeFilter]);

  // Group by Status using the dynamic columnsConfig
  const columns = useMemo(() => {
    const cols: Record<string, Contact[]> = {};
    columnsConfig.forEach(col => cols[col.id] = []);
    
    filteredContacts.forEach(contact => {
      // Only add if the column exists in config
      if (cols[contact.status]) {
        cols[contact.status].push(contact);
      }
    });

    // Sort each column alphabetically by organization name
    Object.keys(cols).forEach(key => {
      cols[key].sort((a, b) => a.organization.localeCompare(b.organization));
    });

    return cols;
  }, [filteredContacts, columnsConfig]);

  // Handle Drag End
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as ContactStatus;
    
    // Create new array to trigger re-render
    const newContacts = contacts.map(c => {
      if (c.id === draggableId) {
        // Logic for auto-updates on drop
        const updates: Partial<Contact> = { status: newStatus };
        if (newStatus !== ContactStatus.RETURN_SCHEDULED) {
          updates.reminderDate = undefined; // clear reminder if moved out
        }
        if (newStatus !== ContactStatus.NOT_CALLED && !c.lastContactDate) {
           updates.lastContactDate = new Date().toISOString();
        }
        return { ...c, ...updates };
      }
      return c;
    });

    setContacts(newContacts);
    saveContacts(newContacts);
  };

  // Actions
  const handleImport = (newContacts: Contact[]) => {
    const existingPhones = new Set(contacts.map(c => c.phone));
    const uniqueNew = newContacts.filter(c => !existingPhones.has(c.phone));
    
    const updated = [...contacts, ...uniqueNew];
    setContacts(updated);
    saveContacts(updated);
  };

  const handleUpdateContact = (updated: Contact) => {
    const newContacts = contacts.map(c => c.id === updated.id ? updated : c);
    setContacts(newContacts);
    saveContacts(newContacts);
  };

  const handleSaveConfig = (newColumns: ColumnType[]) => {
    setColumnsConfig(newColumns);
    saveColumnsConfig(newColumns);
  };

  const handleExport = (onlyToday: boolean) => {
    exportContactsToExcel(contacts, columnsConfig, onlyToday);
    setIsExportMenuOpen(false);
  };

  const pendingReturns = useMemo(() => {
    return contacts.filter(c => c.status === ContactStatus.RETURN_SCHEDULED && isToday(c.reminderDate)).length;
  }, [contacts]);

  // Calculate if board is empty to show hint
  const isBoardEmpty = Object.keys(columns).every(key => columns[key].length === 0);

  return (
    <div className="min-h-screen flex flex-col max-h-screen overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-purple-100 px-4 py-3 shrink-0 z-40 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[100%] mx-auto w-full">
          
          {/* Logo & Stats */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-colors border ${isSidebarOpen ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-gray-500 border-gray-200'}`}
              title={isSidebarOpen ? "Fechar Lista" : "Abrir Lista Sequencial"}
            >
              {isSidebarOpen ? <LayoutGrid className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <img 
                src="https://i.imgur.com/SNwlwxq.png" 
                alt="Logo Agenda da Fran" 
                className="h-10 w-auto object-contain drop-shadow-sm" 
              />
              <h1 className="text-xl font-bold text-purple-900 tracking-tight hidden md:block">
                Agenda da Fran
              </h1>
            </div>
            
            {pendingReturns > 0 && (
              <button 
                onClick={() => setActiveFilter(activeFilter === 'RETURNS_TODAY' ? 'ALL' : 'RETURNS_TODAY')}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all animate-pulse
                  ${activeFilter === 'RETURNS_TODAY' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : 'bg-orange-50 text-orange-600'}
                `}
              >
                <PhoneIncoming className="w-3 h-3" />
                {pendingReturns} Retornos
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 md:justify-end">
            <div className="relative min-w-[200px] w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar (Ex: Federal SP)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>

            <div className="flex gap-2">
               <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-2 font-medium px-3"
                  title="Dashboard de Desempenho"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden lg:inline text-xs">Dashboard</span>
               </button>
               <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                  title="Personalizar Colunas"
                >
                  <Settings className="w-4 h-4" />
               </button>
               
               {/* EXPORT BUTTON with DROPDOWN */}
               <div className="relative" ref={exportMenuRef}>
                 <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className={`p-2 rounded-lg border transition-colors ${isExportMenuOpen ? 'bg-green-100 border-green-300 text-green-800' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                    title="Opções de Exportação"
                  >
                    <Download className="w-4 h-4" />
                 </button>

                 {isExportMenuOpen && (
                   <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exportar Relatórios</span>
                      </div>
                      <button 
                        onClick={() => handleExport(true)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm font-medium text-gray-700 flex items-center gap-3 transition-colors"
                      >
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                           <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                           <span className="block text-gray-900 font-bold">Relatório do Dia</span>
                           <span className="block text-[10px] text-gray-400 font-normal">Contatos trabalhados hoje</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => handleExport(false)}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm font-medium text-gray-700 flex items-center gap-3 transition-colors"
                      >
                         <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                           <Package className="w-5 h-5" />
                        </div>
                        <div>
                           <span className="block text-gray-900 font-bold">Backup Completo</span>
                           <span className="block text-[10px] text-gray-400 font-normal">Toda a base de dados</span>
                        </div>
                      </button>
                   </div>
                 )}
               </div>

               <ImportButton onImport={handleImport} />
            </div>
          </div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar List */}
        <SidebarList 
          contacts={filteredContacts} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          onSelect={(c) => {
            setSelectedContact(c);
            setIsModalOpen(true);
          }}
        />

        {/* Kanban Board */}
        <main 
          className={`flex-1 overflow-x-auto overflow-y-hidden bg-[#fcfaff] p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}
        >
          {isBoardEmpty && contacts.length > 0 && !searchQuery && activeFilter === 'ALL' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none z-0">
                <ArrowLeft className="w-12 h-12 mb-4 animate-bounce text-purple-300" />
                <p className="text-lg font-medium text-purple-900/50">Comece selecionando um contato no Diretório ao lado</p>
             </div>
          )}

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 min-w-max mx-auto relative z-10">
              {columnsConfig.map((column) => (
                <div 
                  key={column.id} 
                  className="flex flex-col w-[280px] md:w-[320px] shrink-0 h-full max-h-full rounded-2xl bg-gray-50/50 border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Column Header */}
                  <div className={`px-4 py-3 border-b border-gray-100 flex justify-between items-center ${column.bg}`}>
                    <h3 className={`font-bold text-sm uppercase tracking-wide ${column.color}`}>
                      {column.title}
                    </h3>
                    <span className="bg-white/60 px-2 py-0.5 rounded-md text-xs font-bold text-gray-500">
                      {columns[column.id].length}
                    </span>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`
                          flex-1 overflow-y-auto p-2 custom-scrollbar transition-colors
                          ${snapshot.isDraggingOver ? 'bg-purple-50/50' : ''}
                        `}
                      >
                        {columns[column.id].map((contact, index) => (
                          <Card 
                            key={contact.id} 
                            contact={contact} 
                            index={index} 
                            onClick={(c) => {
                              setSelectedContact(c);
                              setIsModalOpen(true);
                            }}
                          />
                        ))}
                        {provided.placeholder}
                        
                        {columns[column.id].length === 0 && (
                          <div className="text-center py-10 opacity-40">
                            <p className="text-xs text-gray-400">Vazio</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </main>
      </div>

      <ContactModal 
        contact={selectedContact}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateContact}
        columns={columnsConfig}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        columns={columnsConfig}
        onSave={handleSaveConfig}
      />

      <DashboardModal 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        contacts={contacts}
      />
    </div>
  );
}

export default App;