/**
 * Discussions page: AI Assistant Q&A + (optional) peer/teacher discussions.
 */

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Bot, Send, Sparkles } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type TabId = 'ai' | 'discussions';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
}

// Stub AI response (replace with real API call when you have an API key).
async function getAiReply(userMessage: string): Promise<string> {
  const lower = userMessage.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi')) {
    return "Hello! I'm your CBC Learn assistant. Ask me about topics, quizzes, or how to use the platform.";
  }
  if (lower.includes('quiz') || lower.includes('jiggle')) {
    return "Go to Exam Center → Jiggle Your Mind to practice quizzes. You can filter by subject and grade.";
  }
  if (lower.includes('exam') || lower.includes('sitting')) {
    return "Sitting Exam is for timed written exams. Go to Exam Center → Sitting Exam to see available exams.";
  }
  if (lower.includes('library') || lower.includes('book')) {
    return "Use the Digital Library in the sidebar to browse textbooks, workbooks, and notes by grade and subject.";
  }
  if (lower.includes('streak') || lower.includes('badge') || lower.includes('xp')) {
    return "Check your Dashboard for your learning streak, XP, level, and badges. Complete daily challenges for bonus XP!";
  }
  if (lower.includes('help') || lower.includes('how')) {
    return "I can help with: quizzes (Jiggle Your Mind), written exams (Sitting Exam), library, progress, and daily challenges. What would you like to know?";
  }
  return "Thanks for your question. I'm a demo assistant — connect a real AI API (e.g. OpenAI) for full Q&A. For now, try asking about quizzes, exams, library, or streaks.";
}

export function DiscussionsPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  void onNavigate;

  const [activeTab, setActiveTab] = useState<TabId>('ai');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your CBC Learn AI assistant. Ask me about quizzes, exams, the library, or how to use the platform.",
      at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await getAiReply(text);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: reply,
        at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: "Sorry, I couldn't get a response. Please try again.",
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discussions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">AI Assistant Q&A and community discussions</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ai'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Bot className="w-5 h-5" />
          AI Assistant Q&A
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('discussions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'discussions'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          Discussions
        </button>
      </div>

      {activeTab === 'ai' && (
        <Card className="flex flex-col max-w-3xl">
          <CardHeader className="flex flex-row items-center gap-2 border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ask anything about CBC Learn</p>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col flex-1 min-h-[360px] p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-300 animate-pulse" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about quizzes, exams, library, progress..."
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <Button
                type="button"
                variant="primary"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'discussions' && (
        <Card>
          <CardBody>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Community discussions</p>
              <p className="text-sm mt-1">Peer and teacher discussions will appear here. Coming soon.</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
