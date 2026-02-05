import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { parseImportFile } from '../utils';
import { Contact } from '../types';

interface ImportButtonProps {
  onImport: (contacts: Contact[]) => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const contacts = await parseImportFile(file);
      onImport(contacts);
      alert(`${contacts.length} contatos importados com sucesso!`);
    } catch (error) {
      console.error(error);
      alert('Erro ao importar planilha. Verifique o formato.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Importar Planilha
      </button>
    </>
  );
};

export default ImportButton;