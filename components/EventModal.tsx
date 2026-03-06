import React from 'react';
import { CulturalEvent } from '../types';
import { X, Calendar, Clock, MapPin, ExternalLink, DollarSign, Plus, Check } from 'lucide-react';

interface EventModalProps {
  event: CulturalEvent;
  onClose: () => void;
  isInPlan: boolean;
  onTogglePlan: (event: CulturalEvent) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, isInPlan, onTogglePlan }) => {
  const [isImageExpanded, setIsImageExpanded] = React.useState(false);

  if (!event) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;

    const date = new Date(year, month - 1, day);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    return `${days[date.getDay()]} ${day} de ${months[date.getMonth()]}`;
  };

  return (
    <>
      {/* Expanded Image Overlay */}
      {isImageExpanded && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsImageExpanded(false)}
        >
          <button 
            onClick={() => setIsImageExpanded(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative flex flex-col max-h-[90vh]" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Header */}
          <div 
            className="relative h-64 sm:h-80 shrink-0 cursor-pointer group"
            onClick={() => setIsImageExpanded(true)}
          >
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                Ver imagen completa
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20 pointer-events-none">
              <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full mb-2 shadow-sm">
                {event.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {event.title}
              </h2>
            </div>
          </div>

          {/* Content Scrollable Area */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start space-x-3 text-gray-700">
              <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Fecha</p>
                <p className="font-medium text-lg">{formatDate(event.date)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-gray-700">
              <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Hora</p>
                <p className="font-medium text-lg">{event.time} hrs</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-gray-700">
              <DollarSign className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Costo</p>
                <p className="font-medium text-lg">{event.cost || 'Consultar precio'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-gray-700 sm:col-span-2">
              <MapPin className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Ubicación</p>
                <p className="font-medium text-lg mb-1">{event.location || 'Ubicación por confirmar'}</p>
                {event.mapsUrl && (
                  <a 
                    href={event.mapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm hover:underline"
                  >
                    Ver en Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre el evento</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {event.description || 'No hay descripción disponible para este evento.'}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
           <button 
              onClick={() => onTogglePlan(event)}
              className={`flex items-center justify-center py-3 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                isInPlan 
                  ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isInPlan ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Añadido a mis planes
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Añadir a mi plan
                </>
              )}
            </button>
        </div>
      </div>
    </div>
    </>
  );
};
