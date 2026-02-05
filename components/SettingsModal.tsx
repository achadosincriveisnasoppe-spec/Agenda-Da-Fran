import React, { useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { ColumnType, AVAILABLE_THEMES, DEFAULT_COLUMNS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnType[];
  onSave: (newColumns: ColumnType[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, columns, onSave }) => {
  const [editedColumns, setEditedColumns] = useState<ColumnType[]>(columns);

  // Sync state when modal opens
  React.useEffect(() => {
    setEditedColumns(columns);
  }, [columns, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (id: string, newTitle: string) => {
    setEditedColumns(prev => prev.map(col => 
      col.id === id ? { ...col, title: newTitle } : col
    ));
  };

  const handleThemeChange = (id: string, themeId: string) => {
    const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    setEditedColumns(prev => prev.map(col => 
      col.id === id ? { ...col, color: theme.color, bg: theme.bg } : col
    ));
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as cores e nomes originais?')) {
      setEditedColumns(DEFAULT_COLUMNS);
    }
  };

  const handleSave = () => {
    onSave(editedColumns);
    onClose();
  };

  // Helper to find current theme id based on classes
  const getCurrentThemeId = (col: ColumnType) => {
    const theme = AVAILABLE_THEMES.find(t => t.color === col.color && t.bg === col.bg);
    return theme ? theme.id : 'purple';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Personalizar Colunas</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
            Aqui você pode mudar o nome e a cor das abas do seu CRM para se adaptar ao seu jeito de trabalhar.
          </div>

          <div className="space-y-4">
            {editedColumns.map((col) => (
              <div key={col.id} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                {/* Name Input */}
                <div className="flex-1">
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome da Coluna</label>
                   <input 
                     type="text" 
                     value={col.title}
                     onChange={(e) => handleTitleChange(col.id, e.target.value)}
                     className="w-full p-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none font-semibold text-gray-700"
                   />
                </div>

                {/* Color Picker */}
                <div className="flex-1">
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cor / Tema</label>
                   <div className="flex flex-wrap gap-2 mt-2">
                      {AVAILABLE_THEMES.map(theme => {
                        const isActive = getCurrentThemeId(col) === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(col.id, theme.id)}
                            title={theme.label}
                            className={`
                              w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                              ${theme.preview} 
                              ${isActive ? 'border-gray-600 scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}
                            `}
                          >
                            {isActive && <Check className="w-4 h-4 text-white" />}
                          </button>
                        )
                      })}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-2xl shrink-0">
           <button 
             onClick={handleReset}
             className="flex items-center gap-2 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
           >
             <RotateCcw className="w-4 h-4" /> Restaurar Padrão
           </button>
           <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 shadow-md transition-transform active:scale-95"
              >
                Salvar Alterações
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;