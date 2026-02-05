import { Contact, ContactStatus, ColumnType, DEFAULT_COLUMNS } from './types';
import * as XLSX from 'xlsx';

// --- Local Storage ---
const STORAGE_KEY = 'agenda_fran_contacts';
const CONFIG_KEY = 'agenda_fran_config';

export const loadContacts = (): Contact[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsedData = JSON.parse(data);
    
    // Safety Migration: If user had 'IN_SERVICE' from the brief change, convert back to 'NEGOTIATION'
    const migratedData = parsedData.map((c: any) => ({
      ...c,
      status: c.status === 'IN_SERVICE' ? 'NEGOTIATION' : c.status
    }));

    return migratedData;
  } catch (e) {
    console.error("Erro ao carregar contatos", e);
    return [];
  }
};

export const saveContacts = (contacts: Contact[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error("Erro ao salvar contatos", e);
    alert("Atenção: Armazenamento cheio ou erro ao salvar.");
  }
};

export const loadColumnsConfig = (): ColumnType[] => {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    if (data) {
      // Check if new columns are missing (simple migration check)
      const parsed: ColumnType[] = JSON.parse(data);
      // Check for newest columns
      const hasNewCols = parsed.some(c => 
        c.id === ContactStatus.WHATSAPP_TALK || 
        c.id === ContactStatus.PROPOSAL_SENT ||
        c.id === ContactStatus.DECLINED
      );
      
      if (!hasNewCols) {
        // If missing new columns, merge or reset. 
        // For safety, let's append missing default columns that aren't in the saved config
        const existingIds = new Set(parsed.map(c => c.id));
        const missingDefaults = DEFAULT_COLUMNS.filter(dc => !existingIds.has(dc.id));
        
        return [...parsed, ...missingDefaults];
      }
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao carregar config", e);
  }
  return DEFAULT_COLUMNS;
};

export const saveColumnsConfig = (columns: ColumnType[]) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(columns));
  } catch (e) {
    console.error("Erro ao salvar config", e);
  }
};

// --- Import Logic Helpers ---

const normalize = (str: string) => {
  if (!str) return '';
  return str.toString().toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ""); // Remove special chars for comparison
};

const getValue = (row: any, searchTerms: string[]): string => {
  const keys = Object.keys(row);
  const matchedKey = keys.find(key => {
    const normKey = normalize(key);
    return searchTerms.some(term => normKey.includes(normalize(term)));
  });

  if (matchedKey) {
    let val = String(row[matchedKey]).trim();
    if (val.toLowerCase() === 'nan' || val.toLowerCase() === 'undefined' || val === '') return '';
    return val;
  }
  return '';
};

export const parseImportFile = async (file: File): Promise<Contact[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Use binary string to support various excel formats and encoding
    reader.readAsBinaryString(file);

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Ensure empty cells are not skipped to keep column alignment if headers are complex
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (jsonData.length === 0) {
          throw new Error("Planilha vazia");
        }

        const newContacts: Contact[] = jsonData.map((row: any) => {
          // Specific mapping based on the user's provided file structure
          // Priority 1: "Cliente/Orgão"
          // Priority 2: Fallback to common names
          let orgName = getValue(row, ['clienteorgao', 'cliente', 'orgao', 'empresa', 'instituicao']);
          
          // Contact Name: "Nome Contato"
          const contactPerson = getValue(row, ['nomecontato', 'contato', 'responsavel']);

          // If Org Name is missing but Contact Name exists, swap them or use contact name as org
          if (!orgName && contactPerson) {
             orgName = contactPerson;
          }
          if (!orgName) orgName = 'Sem Nome';

          // Phone: Priority "Celular" -> "Telefone 1" -> "Telefone 2"
          let rawPhone = getValue(row, ['celular', 'whatsapp', 'movel']);
          if (!rawPhone) rawPhone = getValue(row, ['telefone1', 'telefone']);
          if (!rawPhone) rawPhone = getValue(row, ['telefone2']);

          // Location
          const city = getValue(row, ['cidade', 'municipio']);
          const state = getValue(row, ['uf', 'estado']);
          
          // Scope
          const scope = getValue(row, ['nomeambito', 'ambito', 'esfera']);

          // Specific fields
          const email = getValue(row, ['email', 'e-mail', 'correio']);
          const dept = getValue(row, ['departamento', 'setor', 'area']);
          const func = getValue(row, ['funcao', 'cargo', 'ocupacao']);
          
          // Notes explicitly from spreadsheet, otherwise empty
          const obs = getValue(row, ['observacao', 'obs', 'notas']);

          return {
            id: crypto.randomUUID(),
            organization: orgName,
            contactName: contactPerson === 'GERAL' ? '' : contactPerson, // Clean up "GERAL" placeholder
            role: func,
            department: dept,
            email: email,
            phone: rawPhone,
            city: city,
            state: state,
            scope: scope || 'Geral',
            status: ContactStatus.NOT_CALLED,
            notes: obs.trim(),
            createdAt: Date.now()
          };
        });
        
        // Filter out completely empty rows
        const validContacts = newContacts.filter(c => 
          c.organization !== 'Sem Nome' || (c.phone && c.phone.length > 5)
        );

        resolve(validContacts);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- Export Logic ---
export const exportContactsToExcel = (contacts: Contact[], currentColumns: ColumnType[], onlyToday: boolean = false) => {
  try {
    let dataToProcess = contacts;
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    let fileName = `Agenda_Fran_Backup_${dateStr}.xlsx`;

    // Filter Logic
    if (onlyToday) {
       dataToProcess = contacts.filter(c => isToday(c.lastContactDate));
       fileName = `Relatorio_Diario_${dateStr}.xlsx`;

       if (dataToProcess.length === 0) {
         alert("Nenhum contato foi trabalhado hoje para gerar o relatório.");
         return;
       }
    }

    const dataToExport = dataToProcess.map(c => ({
      'Cliente/Orgão': c.organization,
      'Responsável': c.contactName,
      'Cargo': c.role || '',
      'Departamento': c.department || '',
      'Email': c.email || '',
      'Telefone': c.phone,
      'Cidade': c.city,
      'UF': c.state,
      'Âmbito': c.scope,
      'Status Atual': translateStatus(c.status, currentColumns),
      'Observações': c.notes,
      'Data Retorno': c.reminderDate ? formatDate(c.reminderDate) : '',
      'Última Ação': c.lastContactDate ? formatDate(c.lastContactDate) : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, onlyToday ? "Relatório Diário" : "Contatos");
    
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error("Erro ao exportar", error);
    alert("Erro ao exportar arquivo.");
  }
};

const translateStatus = (status: ContactStatus, columns: ColumnType[]) => {
  if (status === ContactStatus.NOT_CALLED) return 'Não Ligado';
  
  // Find user defined name
  const col = columns.find(c => c.id === status);
  if (col) return col.title;

  // Fallback
  switch (status) {
    case ContactStatus.NO_ANSWER: return 'Liguei';
    case ContactStatus.ABSENT: return 'Ausente';
    case ContactStatus.WHATSAPP_TALK: return 'Falei pelo WhatsApp';
    case ContactStatus.EMAIL_SENT: return 'E-mail Enviado';
    case ContactStatus.PROPOSAL_SENT: return 'Proposta Enviada';
    case ContactStatus.RETURN_SCHEDULED: return 'Retorno';
    case ContactStatus.NEGOTIATION: return 'Negociação';
    case ContactStatus.CLOSED: return 'Fechamento';
    case ContactStatus.DECLINED: return 'Declinou';
    case ContactStatus.NOT_INTERESTED: return 'Sem Interesse';
    default: return status;
  }
};

// --- Date Helpers ---
export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const isToday = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

export const isPast = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

export const isThisWeek = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  
  // Adjust to start of week (Sunday)
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  firstDayOfWeek.setHours(0, 0, 0, 0);

  // End of week (Saturday)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);

  return d >= firstDayOfWeek && d <= lastDayOfWeek;
};

export const isThisMonth = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
};