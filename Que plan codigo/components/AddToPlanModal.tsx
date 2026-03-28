import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { UserPlan, createPlan, addEventToPlan, removeEventFromPlan } from '../services/firebase';
import { CulturalEvent } from '../types';

interface AddToPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CulturalEvent | null;
  currentUser: any;
  userPlans: UserPlan[];
  onPlanUpdated: () => void;
}

export const AddToPlanModal: React.FC<AddToPlanModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
  userPlans,
  onPlanUpdated
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim() || !currentUser) return;

    setLoadingPlanId('new');
    try {
      const newPlan = await createPlan(currentUser.uid, newPlanName);
      await addEventToPlan(currentUser.uid, newPlan.id, event.id);
      setNewPlanName('');
      setIsCreating(false);
      onPlanUpdated();
      // onClose(); // Keep open to allow managing multiple lists
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleAddToPlan = async (planId: string) => {
    if (!currentUser) return;
    setLoadingPlanId(planId);
    try {
      await addEventToPlan(currentUser.uid, planId, event.id);
      onPlanUpdated();
      // onClose(); // Keep open to allow managing multiple lists
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleRemoveFromPlan = async (planId: string) => {
    if (!currentUser) return;
    setLoadingPlanId(planId);
    try {
      await removeEventFromPlan(currentUser.uid, planId, event.id);
      onPlanUpdated();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Gestionar en mis planes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4">
            Selecciona las listas donde quieres guardar <span className="font-medium text-gray-900">"{event.title}"</span>
          </p>

          <div className="space-y-2">
            {userPlans.map(plan => {
              const isAlreadyIn = plan.eventIds.includes(event.id);
              return (
                <button
                  key={plan.id}
                  onClick={() => isAlreadyIn ? handleRemoveFromPlan(plan.id) : handleAddToPlan(plan.id)}
                  disabled={!!loadingPlanId}
                  className={`w-full p-3 rounded-xl flex items-center justify-between transition-all group ${
                    isAlreadyIn 
                      ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600' 
                      : 'bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{plan.name}</span>
                  {loadingPlanId === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isAlreadyIn ? (
                    <span className="text-xs font-bold px-2 py-1 bg-green-100 rounded-full group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                      <span className="group-hover:hidden">Guardado</span>
                      <span className="hidden group-hover:inline">Eliminar</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">{plan.eventIds.length} eventos</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Create New Inline */}
          {!isCreating ? (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear nueva lista
            </button>
          ) : (
            <form onSubmit={handleCreatePlan} className="mt-4 bg-gray-50 p-3 rounded-xl">
              <input 
                type="text" 
                autoFocus
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Nombre de la lista..."
                className="w-full p-2 border border-gray-200 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 text-xs text-gray-500"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!!loadingPlanId}
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {loadingPlanId === 'new' ? 'Guardando...' : 'Crear y Guardar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
