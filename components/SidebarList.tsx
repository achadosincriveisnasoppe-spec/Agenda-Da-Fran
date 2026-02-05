import React, { useMemo } from 'react';
import { Contact, ContactStatus } from '../types';
import { Phone, Check, Clock, X, UserX, MessageCircle, Send, FileText, Ban } from 'lucide-react';

interface SidebarListProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SidebarList: React.FC<SidebarListProps> = ({ contacts, onSelect, isOpen, onClose }) => {
  // Group and Sort Logic
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};

    // 1. Group by Scope
    contacts.forEach(contact => {
      const scope = contact.scope ? contact.scope.toUpperCase() : 'OUTROS';
      if (!groups[scope]) groups[scope] = [];
      groups[scope].push(contact);
    });

    // 2. Sort keys (Scopes) and values (Organization Name)
    const sortedGroups: { scope: string; items: Contact[] }[] = [];
    Object.keys(groups).sort().forEach(scope => {
      sortedGroups.push({
        scope,
        items: groups[scope].sort((a, b) => a.organization.localeCompare(b.organization))
      });
    });

    return sortedGroups;
  }, [contacts]);

  // Status Icon Helper
  const getStatusIcon = (status: ContactStatus) => {
    switch (status) {
      case ContactStatus.CLOSED: return <Check className="w-3 h-3 text-green-500" />;
      case ContactStatus.NOT_CALLED: return <div className="w-2 h-2 rounded-full bg-gray-300" />;
      case ContactStatus.RETURN_SCHEDULED: return <Clock className="w-3 h-3 text-blue-500" />;
      case ContactStatus.ABSENT: return <UserX className="w-3 h-3 text-red-400" />;
      case ContactStatus.NO_ANSWER: return <Phone className="w-3 h-3 text-orange-400" />;
      case ContactStatus.WHATSAPP_TALK: return <MessageCircle className="w-3 h-3 text-teal-500" />;
      case ContactStatus.EMAIL_SENT: return <Send className="w-3 h-3 text-sky-500" />;
      case ContactStatus.PROPOSAL_SENT: return <FileText className="w-3 h-3 text-pink-500" />;
      case ContactStatus.DECLINED: return <Ban className="w-3 h-3 text-rose-500" />;
      case ContactStatus.NOT_INTERESTED: return <X className="w-3 h-3 text-gray-400" />;
      default: return <div className="w-2 h-2 rounded-full bg-purple-300" />;
    }
  };

  let globalIndex = 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-purple-50">
        <div>
          <h2 className="font-bold text-purple-900">Diretório</h2>
          <p className="text-xs text-purple-600">{contacts.length} registros encontrados</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-purple-100 rounded text-purple-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {groupedContacts.map((group) => (
          <div key={group.scope} className="mb-6">
            <h3 className="sticky top-0 bg-white/95 backdrop-blur px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2 z-10">
              {group.scope} ({group.items.length})
            </h3>
            <div className="space-y-1">
              {group.items.map((contact) => {
                globalIndex++;
                const isPending = contact.status === ContactStatus.NOT_CALLED;
                
                return (
                  <button
                    key={contact.id}
                    onClick={() => onSelect(contact)}
                    className={`w-full text-left p-2 rounded-md text-sm flex items-start gap-2 hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-100
                      ${!isPending ? 'opacity-60 bg-gray-50' : ''}
                    `}
                  >
                    <span className="font-mono text-[10px] text-gray-400 mt-0.5 w-6 text-right flex-shrink-0">
                      #{globalIndex}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isPending ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                        {contact.organization}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                          {contact.city}/{contact.state}
                        </p>
                        {contact.phone && (
                           <span className="flex items-center gap-0.5 text-[10px] text-gray-400 bg-gray-50 px-1 rounded">
                             <Phone className="w-2 h-2" />
                           </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1">
                      {getStatusIcon(contact.status)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
        {contacts.length === 0 && (
          <div className="text-center py-10 px-4 text-gray-400 text-sm">
            Nenhum contato encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarList;