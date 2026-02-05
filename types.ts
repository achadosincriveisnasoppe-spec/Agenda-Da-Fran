export enum ContactStatus {
  NOT_CALLED = 'NOT_CALLED',
  NO_ANSWER = 'NO_ANSWER', // Agora representa "Liguei"
  ABSENT = 'ABSENT',       // Novo: Ausente
  WHATSAPP_TALK = 'WHATSAPP_TALK', // Novo: Falei pelo Whats
  EMAIL_SENT = 'EMAIL_SENT', // Novo: Email Enviado
  PROPOSAL_SENT = 'PROPOSAL_SENT', // Novo: Proposta Enviada
  RETURN_SCHEDULED = 'RETURN_SCHEDULED',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED = 'CLOSED',       // Agora representa "Fechamento"
  DECLINED = 'DECLINED',   // Novo: Declinou
  NOT_INTERESTED = 'NOT_INTERESTED'
}

export interface Contact {
  id: string;
  organization: string;
  contactName: string; // Responsável
  role?: string;       // Cargo/Função
  department?: string; // Departamento
  email?: string;      // Email
  phone: string;
  city: string;
  state: string;
  scope: string; // Municipal, Estadual, Federal, Privado
  status: ContactStatus;
  lastContactDate?: string; // ISO String
  reminderDate?: string; // ISO String
  notes: string;
  createdAt: number;
}

export interface ColumnType {
  id: ContactStatus;
  title: string;
  color: string;
  bg: string;
}

export interface Theme {
  id: string;
  label: string;
  color: string;
  bg: string;
  preview: string;
}

export const AVAILABLE_THEMES: Theme[] = [
  { id: 'purple', label: 'Roxo', color: 'text-purple-600', bg: 'bg-purple-50', preview: 'bg-purple-600' },
  { id: 'blue', label: 'Azul', color: 'text-blue-600', bg: 'bg-blue-50', preview: 'bg-blue-600' },
  { id: 'green', label: 'Verde', color: 'text-green-600', bg: 'bg-green-50', preview: 'bg-green-600' },
  { id: 'orange', label: 'Laranja', color: 'text-orange-600', bg: 'bg-orange-50', preview: 'bg-orange-600' },
  { id: 'red', label: 'Vermelho', color: 'text-red-600', bg: 'bg-red-50', preview: 'bg-red-600' },
  { id: 'pink', label: 'Rosa', color: 'text-pink-600', bg: 'bg-pink-50', preview: 'bg-pink-600' },
  { id: 'rose', label: 'Rose', color: 'text-rose-600', bg: 'bg-rose-50', preview: 'bg-rose-600' },
  { id: 'gray', label: 'Cinza', color: 'text-gray-600', bg: 'bg-gray-50', preview: 'bg-gray-600' },
  { id: 'cyan', label: 'Ciano', color: 'text-cyan-600', bg: 'bg-cyan-50', preview: 'bg-cyan-600' },
  { id: 'indigo', label: 'Indigo', color: 'text-indigo-600', bg: 'bg-indigo-50', preview: 'bg-indigo-600' },
  { id: 'teal', label: 'Verde Água', color: 'text-teal-600', bg: 'bg-teal-50', preview: 'bg-teal-600' },
  { id: 'sky', label: 'Céu', color: 'text-sky-600', bg: 'bg-sky-50', preview: 'bg-sky-600' },
];

// Default configuration with new columns
export const DEFAULT_COLUMNS: ColumnType[] = [
  { id: ContactStatus.NO_ANSWER, title: 'Liguei', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: ContactStatus.ABSENT, title: 'Ausente', color: 'text-red-500', bg: 'bg-red-50' },
  { id: ContactStatus.WHATSAPP_TALK, title: 'Falei pelo WhatsApp', color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: ContactStatus.EMAIL_SENT, title: 'E-mail Enviado', color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: ContactStatus.PROPOSAL_SENT, title: 'Proposta Enviada', color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: ContactStatus.NEGOTIATION, title: 'Negociação', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: ContactStatus.RETURN_SCHEDULED, title: 'Retorno', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: ContactStatus.CLOSED, title: 'Fechamento', color: 'text-green-600', bg: 'bg-green-50' },
  { id: ContactStatus.DECLINED, title: 'Declinou', color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: ContactStatus.NOT_INTERESTED, title: 'Sem Interesse', color: 'text-gray-500', bg: 'bg-gray-100' },
];