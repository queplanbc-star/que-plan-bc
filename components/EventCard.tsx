import React from 'react';
import { CulturalEvent } from '../types';
import { Calendar, Clock, MapPin, Plus, Check } from 'lucide-react';

interface EventCardProps {
  event: CulturalEvent;
  isInPlan: boolean;
  onTogglePlan: (event: CulturalEvent) => void;
  variant?: 'default' | 'compact';
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, isInPlan, onTogglePlan, variant = 'default', onClick }) => {
  const isCompact = variant === 'compact';

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
    <div 
      onClick={onClick}
      className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex cursor-pointer ${isCompact ? 'flex-row h-24 sm:h-32' : 'flex-col'}`}
    >
      <div className={`relative overflow-hidden ${isCompact ? 'w-1/3' : 'w-full h-32 sm:h-48'}`}>
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold text-gray-800 shadow-sm">
          {event.category}
        </div>
      </div>
      
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className={`font-bold text-gray-800 leading-tight ${isCompact ? 'text-xs sm:text-sm mb-1 line-clamp-2' : 'text-sm sm:text-lg mb-2'}`}>
            {event.title}
          </h3>
          
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center text-gray-500 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-indigo-500" />
              <span className="truncate">{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-indigo-500" />
              <span>{event.time}</span>
            </div>
            {!isCompact && event.location && (
               <div className="flex items-center text-gray-500 text-xs sm:text-sm">
               <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-indigo-500" />
               <span className="truncate">{event.location}</span>
             </div>
            )}
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlan(event);
          }}
          className={`mt-3 sm:mt-4 w-full flex items-center justify-center py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isInPlan 
              ? 'bg-green-50 text-green-600 hover:bg-green-100' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isInPlan ? (
            <>
              <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              {isCompact ? 'Añadido' : 'Añadido'}
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              {isCompact ? 'Añadir' : 'Añadir al Plan'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
