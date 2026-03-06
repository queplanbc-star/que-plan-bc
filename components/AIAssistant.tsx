import React, { useState, useRef, useEffect } from 'react';
import { CulturalEvent } from '../types';
import { generateEventRecommendations } from '../services/geminiService';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface AIAssistantProps {
  events: CulturalEvent[];
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ events }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "¡Hola! Soy tu guía cultural. ¿Buscas algo en específico para hoy?", sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const aiResponseText = await generateEventRecommendations(userMsg.text, events);
    
    const aiMsg: Message = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Asistente Cultural</h3>
                <p className="text-indigo-200 text-xs">Potenciado por Gemini</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-xs text-gray-500">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ej. ¿Qué hay para niños hoy?"
                className="flex-1 p-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
