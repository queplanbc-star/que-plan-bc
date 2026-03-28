import React, { useState } from 'react';
import { CulturalEvent } from '../types';
import { Save, RefreshCw, AlertTriangle, FileJson, Wand2, Copy, Check, ExternalLink } from 'lucide-react';
import { generateEventDescription } from '../services/geminiService';

interface AdminPanelProps {
  currentEvents: CulturalEvent[];
  onUpdateEvents: (events: CulturalEvent[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentEvents, onUpdateEvents }) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize with current data
  React.useEffect(() => {
    setJsonInput(JSON.stringify(currentEvents, null, 2));
  }, [currentEvents]);

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("El formato debe ser un arreglo de eventos [].");
      setError(null);
      setSuccess("JSON válido. Listo para actualizar.");
      return parsed;
    } catch (e) {
      setError((e as Error).message);
      setSuccess(null);
      return null;
    }
  };

  const handleReplace = () => {
    const data = handleValidate();
    if (data) {
      if (window.confirm("ATENCIÓN: Esto solo actualizará tu vista ACTUAL en este navegador. Para actualizar la web pública, debes copiar el JSON y subirlo a tu proveedor de datos (ej. GitHub Gist). ¿Deseas continuar?")) {
        onUpdateEvents(data);
        setSuccess("Vista local actualizada. No olvides copiar y subir el JSON.");
      }
    }
  };

  const handleEnhanceWithAI = async () => {
    const data = handleValidate();
    if (!data) return;

    setIsProcessing(true);
    setSuccess(null);
    const updatedData = [...data];
    let changesCount = 0;

    try {
      for (let i = 0; i < updatedData.length; i++) {
        const ev = updatedData[i];
        if (!ev.description || ev.description.length < 10) {
          ev.description = await generateEventDescription(ev.title, ev.category);
          changesCount++;
        }
      }
      setJsonInput(JSON.stringify(updatedData, null, 2));
      setSuccess(`IA: Se generaron descripciones para ${changesCount} eventos.`);
    } catch (e) {
      setError("Error al conectar con la IA.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonInput);
    setCopied(true);
    setSuccess("JSON copiado al portapapeles. Ahora pégalo en tu archivo remoto.");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in mb-12">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-orange-100 p-3 rounded-full">
          <FileJson className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Editor de Eventos (Modo Admin)</h2>
          <p className="text-gray-500 text-sm">Gestiona tu cartelera generando un JSON para tu base de datos remota.</p>
        </div>
      </div>

      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExternalLink className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-800">¿Cómo actualizar la web pública?</h3>
            <ol className="list-decimal ml-4 mt-2 text-sm text-indigo-700 space-y-1">
              <li>Edita los eventos en la caja de texto inferior (o añade nuevos).</li>
              <li>Usa el botón <strong>"Copiar JSON"</strong>.</li>
              <li>Ve a tu proveedor de datos (ej. GitHub Gist o npoint.io) y pega el contenido.</li>
              <li>La web detectará los cambios automáticamente al recargar.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full h-96 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent scrollbar-thin"
          spellCheck={false}
        />
        <div className="absolute top-2 right-2 flex space-x-2">
           <button
             onClick={handleEnhanceWithAI}
             disabled={isProcessing}
             className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded flex items-center shadow-lg transition-colors disabled:opacity-50"
             title="Generar descripciones automáticas para eventos vacíos"
           >
             <Wand2 className={`w-3 h-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
             {isProcessing ? 'Generando...' : 'Completar con IA'}
           </button>
        </div>
      </div>

      {(error || success) && (
        <div className={`mt-4 p-3 rounded-md ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {error || success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-gray-100">
        <button
          onClick={handleReplace}
          className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none shadow-sm transition-all"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Probar Localmente
        </button>
        
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all"
        >
          {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
          {copied ? '¡Copiado!' : 'Copiar JSON para subir'}
        </button>
      </div>
    </div>
  );
};