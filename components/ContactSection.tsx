import React from 'react';
import { Send, Mail } from 'lucide-react';

export const ContactSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <section id={id} className="py-12 bg-white rounded-2xl shadow-sm border border-gray-100 mb-12 animate-fade-in">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            ¿Tienes o conoces un evento?
          </h2>
          <p className="text-lg text-indigo-600 font-medium">
            Agrégalo a Qué Plan y llega a más personas.
          </p>
        </div>

        <form 
          action="https://formspree.io/f/mvzwpzgq" 
          method="POST"
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                Nombre del Evento
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-gray-50 focus:bg-white"
                placeholder="Ej. Concierto de Jazz"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
                Fecha y Hora
              </label>
              <input
                type="text"
                id="dateTime"
                name="dateTime"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-gray-50 focus:bg-white"
                placeholder="Ej. 15 Oct, 8:00 PM"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Lugar / Recinto
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-gray-50 focus:bg-white"
                placeholder="Ej. Teatro de la Ciudad"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="posterLink" className="block text-sm font-medium text-gray-700">
                Link del Póster (Drive)
              </label>
              <input
                type="url"
                id="posterLink"
                name="posterLink"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-gray-50 focus:bg-white"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Tu Correo de Contacto
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-gray-50 focus:bg-white"
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Mensaje (opcional)
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-gray-50 focus:bg-white resize-none"
              placeholder="Detalles adicionales..."
            ></textarea>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <Send className="w-5 h-5" />
              Enviar Propuesta
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm flex items-center justify-center gap-2 flex-wrap">
                <span>O si prefieres, escríbenos directamente a:</span>
                <a href="mailto:queplan.bc@gmail.com" className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  queplan.bc@gmail.com
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
