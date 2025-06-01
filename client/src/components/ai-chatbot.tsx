import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Minimize2, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Component for rendering search results with animations
function SearchResultItem({ text, delay }: { text: string; delay: number }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Check if the text contains a link pattern [text](url)
  const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  
  if (linkMatch) {
    const [fullMatch, linkText, url] = linkMatch;
    const beforeLink = text.substring(0, text.indexOf(fullMatch));
    const afterLink = text.substring(text.indexOf(fullMatch) + fullMatch.length);
    
    return (
      <div className={`transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      }`}>
        <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer hover:shadow-sm hover:scale-[1.02]">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse group-hover:animate-none group-hover:bg-blue-600 transition-colors duration-200"></div>
          <div className="flex-1">
            {beforeLink}
            <a 
              href={url} 
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // Add click animation
                e.currentTarget.style.transform = 'scale(0.95)';
                setTimeout(() => {
                  e.currentTarget.style.transform = 'scale(1)';
                  window.location.href = url;
                }, 100);
              }}
            >
              {linkText}
            </a>
            {afterLink}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`transition-all duration-500 ease-out transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
    }`}>
      <div className="flex items-center gap-2 p-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <span>{text}</span>
      </div>
    </div>
  );
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Parent Helper assistant. Ask me about baby and toddler classes in your area!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/ask', {
        question: inputValue
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50 
                   transition-all duration-300 hover:scale-110 hover:shadow-xl
                   animate-pulse"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white transition-transform duration-200" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-80 shadow-2xl z-50 
                     transition-all duration-500 ease-in-out transform
                     ${isMinimized ? 'h-14 scale-95' : 'h-96 scale-100'}
                     animate-in slide-in-from-bottom-5 fade-in-0`}>
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-sm font-medium transition-opacity duration-200">
          Parent Helper Assistant
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-blue-700 transition-all duration-200 hover:scale-110"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4 transition-transform duration-200" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-blue-700 transition-all duration-200 hover:scale-110"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4 transition-transform duration-200" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-full">
          <ScrollArea className="flex-1 p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} 
                           animate-in slide-in-from-bottom-3 fade-in-0 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm transition-all duration-200 hover:shadow-md ${
                    message.isUser
                      ? 'bg-blue-600 text-white rounded-br-none hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none hover:bg-gray-50'
                  }`}
                >
                  {!message.isUser && message.text.includes('• [') ? (
                    // Render search results with animations
                    <div className="space-y-1">
                      {message.text.split('\n').map((line, lineIndex) => {
                        if (line.trim() === '') return null;
                        if (line.startsWith('• [') || line.startsWith('[View all')) {
                          return (
                            <SearchResultItem 
                              key={lineIndex} 
                              text={line} 
                              delay={lineIndex * 100} 
                            />
                          );
                        }
                        return (
                          <div key={lineIndex} className="mb-2 font-medium">
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.text}</div>
                  )}
                  
                  <div className={`text-xs mt-1 opacity-70 transition-opacity duration-200 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-3 fade-in-0">
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-gray-600">Searching classes...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-4 border-t bg-gray-50/50">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about classes in your area..."
                className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-sm hover:shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Try asking: "Swimming classes in Winchester" or "Baby music classes near me"
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}