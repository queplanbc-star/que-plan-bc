import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { signInWithGoogle, loginWithEmail, registerWithEmail } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Redirect happens, so no need to close modal immediately as page will reload/redirect
    } catch (err: any) {
      setError('Error al iniciar con Google. Intenta de nuevo.');
      setIsLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
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
              {mode === 'login' ? 'Ingresa para guardar tus planes' : 'Regístrate para personalizar tu experiencia'}
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all mb-6"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Continuar con Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o con correo</span>
            </div>
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
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
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
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
