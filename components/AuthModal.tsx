import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '../services/firebase';
import { sendCustomPasswordResetEmail } from '../services/resendService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleResetPassword = async () => {
    if (!email) {
      alert('Por favor, ingresa tu correo electrónico para enviarte el enlace de recuperación');
      return;
    }
    
    setIsResettingPassword(true);
    setSuccessMessage('');
    setError('');
    
    try {
      // Usamos un enlace de recuperación simulado o la URL base por ahora
      const resetLink = `${window.location.origin}/reset-password`;
      await sendCustomPasswordResetEmail(email, resetLink);
      
      const successText = "¡Listo! Te enviamos un correo personalizado de Qué Plan. Si no lo ves, revisa tu carpeta de Spam.";
      setSuccessMessage(successText);
      alert(successText);
      setIsResettingPassword(false);
    } catch (err: any) {
      console.error(err);
      alert('No pudimos enviar el correo. Asegúrate de que la dirección sea correcta o intenta más tarde.');
      setIsResettingPassword(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onClose(); // Close modal on success
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              {mode === 'login' ? 'Ingresa para armar, guardar y compartir tu Plan' : 'Regístrate para armar, guardar y compartir tu Plan'}
            </p>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="tu@email.com"
                />
              </div>
              {successMessage && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  {successMessage}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {mode === 'login' && (
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResettingPassword || !!successMessage}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResettingPassword ? 'Enviando instrucciones...' : (successMessage ? 'Enlace enviado' : '¿Olvidaste tu contraseña?')}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccessMessage(''); }}
                className="ml-1 text-indigo-600 font-semibold hover:underline"
              >
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
