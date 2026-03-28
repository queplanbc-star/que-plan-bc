import React, { useState, useEffect } from 'react';
import { X, User, Loader2, Save } from 'lucide-react';
import { updateUserProfile } from '../services/firebase';
import { fetchAvatars } from '../services/dataService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onProfileUpdated }) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setDisplayName(currentUser.displayName || '');
      setSelectedAvatar(currentUser.photoURL || '');
      loadAvatars();
    }
  }, [isOpen, currentUser]);

  const loadAvatars = async () => {
    setIsLoadingAvatars(true);
    const urls = await fetchAvatars();
    setAvatars(urls);
    setIsLoadingAvatars(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await updateUserProfile(currentUser.uid, displayName, selectedAvatar);
      onProfileUpdated();
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-xl text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-indigo-600" />
            Personalizar Perfil
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de Usuario</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 text-base bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                placeholder="Tu nombre..."
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Elige tu Avatar</label>
              
              {isLoadingAvatars ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {avatars.map((url, index) => (
                    <div 
                      key={index}
                      onClick={() => setSelectedAvatar(url)}
                      className={`cursor-pointer rounded-full aspect-square overflow-hidden border-2 transition-all transform hover:scale-105 ${
                        selectedAvatar === url 
                          ? 'border-indigo-600 ring-4 ring-indigo-200 scale-105' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`Avatar ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {avatars.length === 0 && !isLoadingAvatars && (
                <p className="text-sm text-gray-500 text-center py-4">No se pudieron cargar los avatares.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-6">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
