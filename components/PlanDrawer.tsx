import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, ChevronRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { UserPlan, createPlan, removeEventFromPlan, deletePlan } from '../services/firebase';
import { CulturalEvent } from '../types';
import { AppConfig } from '../services/dataService';

interface PlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  userPlans: UserPlan[];
  allEvents: CulturalEvent[];
  onPlanCreated: () => void; // Refresh plans
  onEventRemoved: () => void; // Refresh plans
  onEventClick: (event: CulturalEvent) => void;
  appConfig: AppConfig | null;
}

export const PlanDrawer: React.FC<PlanDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  userPlans,
  allEvents,
  onPlanCreated,
  onEventRemoved,
  onEventClick,
  appConfig
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      await createPlan(currentUser.uid, newPlanName);
      setNewPlanName('');
      setIsCreating(false);
      onPlanCreated();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!currentUser || !window.confirm('¿Estás seguro de que deseas eliminar este plan?')) return;
    try {
      await deletePlan(currentUser.uid, planId);
      onPlanCreated(); // Refresh list
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveEvent = async (planId: string, eventId: string) => {
    if (!currentUser) return;
    try {
      await removeEventFromPlan(currentUser.uid, planId, eventId);
      // Update local state for immediate feedback if viewing a plan
      if (selectedPlan) {
        setSelectedPlan({
          ...selectedPlan,
          eventIds: selectedPlan.eventIds.filter(id => id !== eventId)
        });
      }
      onEventRemoved();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSharePlan = () => {
    if (!selectedPlan) return;
    
    const ids = selectedPlan.eventIds.join(',');
    const shareUrl = `${window.location.origin}${window.location.pathname}?ids=${ids}`;
    const phrase = appConfig?.sharePhrase || "¡Mira este plan que armé en Qué Plan!";
    const planName = selectedPlan.name;
    
    // Exact requested structure:
    // [Frase de Sheets] (espacio) "[Nombre del Plan]": (espacio) [Link]
    const mensajeFinal = encodeURIComponent(phrase + ' "' + planName + '": ') + shareUrl;
    const whatsappUrl = 'https://wa.me/?text=' + mensajeFinal;
    
    window.open(whatsappUrl, '_blank');
  };

  const getPlanEvents = (plan: UserPlan) => {
    return plan.eventIds.map(id => allEvents.find(e => e.id === id)).filter(Boolean) as CulturalEvent[];
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          {selectedPlan ? (
             <button 
               onClick={() => setSelectedPlan(null)}
               className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
             >
               <ArrowLeft className="w-5 h-5 mr-1" />
               <span className="font-medium">Mis Planes</span>
             </button>
          ) : (
            <h2 className="text-xl font-bold text-gray-800">Mis Planes</h2>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          
          {!currentUser ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">Inicia sesión para crear y guardar tus planes.</p>
            </div>
          ) : selectedPlan ? (
            // Single Plan View
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedPlan.eventIds.length} eventos</p>
                </div>
                <button
                  onClick={() => handleDeletePlan(selectedPlan.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-lg"
                  title="Eliminar plan completo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Share Button */}
              {selectedPlan.eventIds.length > 0 && (
                <button
                  onClick={handleSharePlan}
                  className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 mb-4"
                >
                  <MessageCircle className="w-5 h-5" />
                  Compartir mi Plan
                </button>
              )}

              {selectedPlan.eventIds.length === 0 ? (
                <div className="text-center py-12">
                   <p className="text-gray-500">Este plan está vacío.</p>
                   <p className="text-sm text-gray-400 mt-1">¡Añade eventos desde la cartelera!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getPlanEvents(selectedPlan).map(event => (
                    <div 
                      key={event.id} 
                      onClick={() => onEventClick(event)}
                      className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 group cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">{event.date} • {event.time}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEvent(selectedPlan.id, event.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Plans List View
            <div className="space-y-4">
              {/* Create New Plan Button */}
              {!isCreating ? (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear nuevo plan
                </button>
              ) : (
                <form onSubmit={handleCreatePlan} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del plan</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="Ej. Cumpleaños, Fin de semana..."
                    className="w-full p-2 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Plans */}
              <div className="space-y-3 mt-6">
                {userPlans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aún no tienes planes armados.</p>
                  </div>
                ) : (
                  userPlans.map(plan => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{plan.eventIds.length} eventos</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlan(plan.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors mr-1"
                          title="Eliminar plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
