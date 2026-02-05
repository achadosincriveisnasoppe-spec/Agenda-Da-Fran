import React, { useState, useEffect } from 'react';
import { X, Phone, Calendar, CheckCircle, XCircle, Briefcase, AlertCircle, MessageCircle, Globe, User, Building, Mail, CreditCard, UserX, Send, FileText, Ban, Bell } from 'lucide-react';
import { Contact, ContactStatus, ColumnType, DEFAULT_COLUMNS } from '../types';

interface ContactModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedContact: Contact) => void;
  columns?: ColumnType[];
}

const ContactModal: React.FC<ContactModalProps> = ({ contact, isOpen, onClose, onUpdate, columns = DEFAULT_COLUMNS }) => {
  // Base fields
  const [notes, setNotes] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  
  // New specific fields
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (contact) {
      setNotes(contact.notes || '');
      setReminderDate(contact.reminderDate ? contact.reminderDate.split('T')[0] : '');
      
      // Load specific fields
      setContactName(contact.contactName || '');
      setRole(contact.role || '');
      setDepartment(contact.department || '');
      setEmail(contact.email || '');
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  // Helpers to get title dynamically
  const getTitle = (id: ContactStatus) => {
    const col = columns.find(c => c.id === id);
    return col ? col.title : '...';
  };

  const saveChanges = (overrideStatus?: ContactStatus) => {
    const updates: Partial<Contact> = { 
       notes,
       contactName,
       role,
       department,
       email
    };

    if (overrideStatus) {
      updates.status = overrideStatus;
      updates.lastContactDate = new Date().toISOString();

      if (overrideStatus === ContactStatus.RETURN_SCHEDULED && reminderDate) {
        updates.reminderDate = new Date(reminderDate).toISOString();
      } else if (overrideStatus !== ContactStatus.RETURN_SCHEDULED) {
        updates.reminderDate = undefined;
      }
    }

    onUpdate({ ...contact, ...updates });
  };

  const handleSaveOnly = () => {
    saveChanges();
    // Don't close, just save details
    alert('Dados salvos!');
  };

  const handleStatusChange = (status: ContactStatus) => {
    saveChanges(status);
    onClose();
  };

  const getWhatsappLink = (phone: string) => {
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  };

  const getGoogleSearchLink = (term: string, city: string) => {
    const query = encodeURIComponent(`${term} ${city} contato`);
    return `https://www.google.com/search?q=${query}`;
  };

  const openGoogleCalendar = () => {
    if (!reminderDate) return;
    
    const title = `Ligar: ${contact.organization}`;
    const details = `Contato: ${contactName || 'Geral'}\nTelefone: ${contact.phone}\nNotas: ${notes}`;
    
    // Format date for Google Calendar YYYYMMDD
    const dateStr = reminderDate.replace(/-/g, '');
    const dates = `${dateStr}/${dateStr}`; // All day event

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${dates}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-start z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">{contact.organization}</h2>
            <p className="text-gray-500 text-sm mt-1">{contact.city}/{contact.state}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 flex-1 overflow-y-auto">
          
          {/* Quick Info & External Tools */}
          <div className="flex gap-3">
             <a 
               href={getGoogleSearchLink(contact.organization, contact.city)}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors text-sm font-medium"
             >
                <Globe className="w-4 h-4" /> Pesquisar Órgão
             </a>
             <a 
               href={getWhatsappLink(contact.phone)}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 bg-green-50 text-green-700 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 transition-colors text-sm font-medium"
             >
                <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
             </a>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
             <div>
               <span className="block text-gray-400 text-xs uppercase font-bold">Telefone</span>
               <span className="text-gray-900 font-semibold">{contact.phone}</span>
             </div>
             <span className="text-gray-500 text-xs bg-white px-2 py-1 rounded border">{contact.scope}</span>
          </div>

          {/* Dados do Responsável - EDITABLE GRID */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
             <h3 className="text-xs font-bold text-purple-800 uppercase mb-3 flex items-center gap-1.5">
               <User className="w-3.5 h-3.5" /> Dados do Responsável
             </h3>
             
             <div className="space-y-3">
                {/* Nome */}
                <div>
                   <label className="text-[10px] text-gray-500 font-semibold uppercase">Nome do Responsável</label>
                   <input 
                     type="text" 
                     value={contactName}
                     onChange={(e) => setContactName(e.target.value)}
                     placeholder="Nome"
                     className="w-full mt-1 p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                   />
                </div>

                {/* Cargo e Depto */}
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cargo</label>
                      <input 
                        type="text" 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Ex: Diretor"
                        className="w-full mt-1 p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1"><Building className="w-3 h-3" /> Depto</label>
                      <input 
                        type="text" 
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Ex: Compras"
                        className="w-full mt-1 p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      />
                   </div>
                </div>

                {/* Email */}
                <div>
                   <label className="text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</label>
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="email@exemplo.com"
                     className="w-full mt-1 p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                   />
                </div>
             </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
             <h3 className="text-sm font-semibold text-gray-900">Registrar Ação</h3>

             {/* Communication Attempts */}
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleStatusChange(ContactStatus.NO_ANSWER)}
                  className="flex items-center justify-center gap-1.5 bg-orange-100 text-orange-700 py-2.5 rounded-lg font-medium hover:bg-orange-200 transition-colors text-sm"
                >
                  <Phone className="w-3.5 h-3.5" /> {getTitle(ContactStatus.NO_ANSWER)}
                </button>
                <button 
                  onClick={() => handleStatusChange(ContactStatus.ABSENT)}
                  className="flex items-center justify-center gap-1.5 bg-red-100 text-red-700 py-2.5 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
                >
                  <UserX className="w-3.5 h-3.5" /> {getTitle(ContactStatus.ABSENT)}
                </button>
                <button 
                  onClick={() => handleStatusChange(ContactStatus.WHATSAPP_TALK)}
                  className="flex items-center justify-center gap-1.5 bg-teal-100 text-teal-700 py-2.5 rounded-lg font-medium hover:bg-teal-200 transition-colors text-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> {getTitle(ContactStatus.WHATSAPP_TALK)}
                </button>
                 <button 
                  onClick={() => handleStatusChange(ContactStatus.EMAIL_SENT)}
                  className="flex items-center justify-center gap-1.5 bg-sky-100 text-sky-700 py-2.5 rounded-lg font-medium hover:bg-sky-200 transition-colors text-sm"
                >
                  <Send className="w-3.5 h-3.5" /> {getTitle(ContactStatus.EMAIL_SENT)}
                </button>
             </div>

             <div className="h-px bg-gray-100 w-full my-2"></div>

             {/* Progress */}
             <div className="space-y-3">
               <div className="grid grid-cols-2 gap-2">
                   <button 
                    onClick={() => handleStatusChange(ContactStatus.PROPOSAL_SENT)}
                    className="flex items-center justify-center gap-1.5 bg-pink-100 text-pink-700 py-3 rounded-lg font-bold hover:bg-pink-200 transition-colors"
                  >
                    <FileText className="w-4 h-4" /> {getTitle(ContactStatus.PROPOSAL_SENT)}
                  </button>
                   <button 
                    onClick={() => handleStatusChange(ContactStatus.NEGOTIATION)}
                    className="flex items-center justify-center gap-2 bg-purple-100 text-purple-700 py-3 rounded-lg font-bold hover:bg-purple-200 transition-colors"
                  >
                    <Briefcase className="w-4 h-4" /> {getTitle(ContactStatus.NEGOTIATION)}
                  </button>
               </div>

               {/* Schedule Return */}
               <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                 <label className="block text-xs font-bold text-blue-800 mb-2 uppercase">Agendar {getTitle(ContactStatus.RETURN_SCHEDULED)}</label>
                 
                 <div className="flex gap-2 mb-2">
                   <input 
                     type="date" 
                     value={reminderDate}
                     onChange={(e) => setReminderDate(e.target.value)}
                     className="flex-1 p-2 rounded border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>
                 
                 <div className="flex gap-2">
                   {/* Botão Google Calendar (Auxiliar) */}
                   <button 
                     onClick={openGoogleCalendar}
                     disabled={!reminderDate}
                     className="flex-1 bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded text-xs font-bold uppercase tracking-wide hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                     title="Criar lembrete no Google Agenda"
                   >
                     <Bell className="w-3 h-3" /> Criar Alerta
                   </button>

                   {/* Botão Principal (Salva no App) */}
                   <button 
                     disabled={!reminderDate}
                     onClick={() => handleStatusChange(ContactStatus.RETURN_SCHEDULED)}
                     className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-xs font-bold uppercase tracking-wide hover:bg-blue-700 flex items-center justify-center gap-1"
                   >
                     <Calendar className="w-3 h-3" /> Agendar
                   </button>
                 </div>
                 <p className="text-[10px] text-blue-400 mt-2 text-center">
                    "Agendar" salva no app. "Criar Alerta" abre sua agenda do Google.
                 </p>
               </div>
             </div>

             <div className="h-px bg-gray-100 w-full my-2"></div>

             {/* Finalization */}
             <div className="space-y-2">
                <button 
                  onClick={() => handleStatusChange(ContactStatus.CLOSED)}
                  className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2.5 rounded-lg font-medium hover:bg-green-200 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> {getTitle(ContactStatus.CLOSED)}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleStatusChange(ContactStatus.DECLINED)}
                    className="flex items-center justify-center gap-2 bg-rose-100 text-rose-700 py-2.5 rounded-lg font-medium hover:bg-rose-200 transition-colors"
                  >
                    <Ban className="w-4 h-4" /> {getTitle(ContactStatus.DECLINED)}
                  </button>
                  <button 
                    onClick={() => handleStatusChange(ContactStatus.NOT_INTERESTED)}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" /> {getTitle(ContactStatus.NOT_INTERESTED)}
                  </button>
                </div>
             </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Observações Adicionais</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Use este espaço para suas anotações pessoais..."
              className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end rounded-b-2xl shrink-0">
           <button 
             onClick={handleSaveOnly}
             className="text-purple-700 font-medium text-sm hover:underline px-4 mr-2"
           >
             Salvar Dados
           </button>
           <button 
             onClick={onClose}
             className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-900"
           >
             Fechar
           </button>
        </div>

      </div>
    </div>
  );
};

export default ContactModal;