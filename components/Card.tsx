import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Contact, ContactStatus } from '../types';
import { Phone, MapPin, CalendarClock, AlertTriangle, User } from 'lucide-react';
import { formatDate, isPast, isToday } from '../utils';

interface CardProps {
  contact: Contact;
  index: number;
  onClick: (contact: Contact) => void;
}

const Card: React.FC<CardProps> = ({ contact, index, onClick }) => {
  const isReturn = contact.status === ContactStatus.RETURN_SCHEDULED;
  const isOverdue = isReturn && isPast(contact.reminderDate);
  const isDueToday = isReturn && isToday(contact.reminderDate);
  const hasPhone = contact.phone && contact.phone.length > 2;

  return (
    <Draggable draggableId={contact.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(contact)}
          className={`
            bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3 cursor-pointer group
            hover:shadow-md transition-all
            ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 z-50' : ''}
            ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
            ${isDueToday ? 'border-l-4 border-l-orange-400' : ''}
          `}
          style={provided.draggableProps.style}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight flex-1">
              <span className="text-purple-400/70 font-mono text-[10px] mr-1">#{index + 1}</span>
              {contact.organization}
            </h4>
            {contact.scope && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium whitespace-nowrap ml-2">
                {contact.scope}
              </span>
            )}
          </div>

          {/* Aba do Responsável */}
          <div className="mb-2">
            {contact.contactName ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wide">
                <User className="w-3 h-3" />
                {contact.contactName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-400 text-[11px] font-medium">
                <User className="w-3 h-3" />
                Sem Responsável
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-gray-50">
            {hasPhone && (
              <div className="flex items-center text-xs text-gray-500 gap-1.5">
                <Phone className="w-3 h-3 text-gray-400" />
                <span>{contact.phone}</span>
              </div>
            )}
            
            {(contact.city || contact.state) && (
              <div className="flex items-center text-xs text-gray-400 gap-1.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{contact.city}{contact.city && contact.state ? ' - ' : ''}{contact.state}</span>
              </div>
            )}

            {/* Reminder Badge */}
            {isReturn && contact.reminderDate && (
              <div className={`
                mt-1 flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md w-fit
                ${isOverdue ? 'bg-red-50 text-red-600' : isDueToday ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}
              `}>
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                {!isOverdue && <CalendarClock className="w-3 h-3" />}
                <span>{isOverdue ? 'Atrasado: ' : ''}{formatDate(contact.reminderDate)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default React.memo(Card);