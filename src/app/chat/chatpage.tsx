"use client";
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];

  // 🚨 关键改动：不再使用 scrollIntoView。
  // scrollIntoView 会把所有可滚动的祖先容器一起滚动（包括中间 card 的外层，
  // 甚至可能波及顶部横条所在的根容器）；这里直接设置消息容器的 scrollTop，
  // 所以只会在中间的 chat 消息区内部上下滚动，顶部横条完全不受影响。
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const showLoader =
    status === 'streaming' &&
    lastMessage?.role === 'assistant' &&
    lastMessage?.parts.length === 0;

  return (
    // 🚨 关键改动 1：让 Chat 在 Ant Design 的 Content 内完美居中
    <div className="h-full w-full flex flex-col items-center">
      
      {/* 🚨 关键改动 2：消息区 w-full 且完美居中。
          唯一的滚动容器就是这里：min-h-0 防止内容把布局撑大，
          ref 用于在消息增加时只滚动这个容器（不影响顶部横条）。 */}
      <div ref={messagesScrollRef} className="flex-1 min-h-0 overflow-y-auto w-full chat-scroll">
        <div className="max-w-3xl mx-auto">
          {messages.map(message => (
            <div
              key={message.id}
              className={`whitespace-pre-wrap mb-4 flex flex-col ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`mb-1 text-sm font-bold ${
                  message.role === 'user' ? 'text-cyan-600' : 'text-orange-900'
                }`}
              >
                {message.role === 'user' ? '👨‍💼 USER: ' : '🤖 AI: '}
              </div>

              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className={`whitespace-pre-wrap my-2 px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 w-full max-w-3xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-cyan-400/20 to-orange-100/10 text-blue border-green-700/50 shadow-[0_0_15px_rgba(61, 124, 196, 0.4),inset_0_0_10px_rgba(255,215,0,0.1)] hover:border-yellow-100/60 hover:shadow-[0_0_20px_rgba(255,215,0,0.6)] max-w-2xl'
                            : 'bg-slate-900/70 text-slate-100 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.4)]'
                        }`}
                      >
                        {part.text}
                      </div>
                    );

                  case 'tool-weather': {
                    const location = part.input?.location;
                    const temperature = part.output?.temperature;
                    return (
                      <div key={`${message.id}-${i}`}>
                        <div className="font-bold text-cyan-400">温度查询结果</div>
                        <div>📍Location: {location}</div>
                        <div className="text-slate-100">🌡️Temperature: {temperature}</div>
                      </div>
                    );
                  }

                  default:
                    return null;
                }
              })}
            </div>
          ))}
          {/* 底部锚点：始终指向消息列表的最末尾 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 🚨 关键改动 3：输入框也是 w-full，且完美居中，与消息区宽度一致 */}
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
        className="flex-shrink-0 w-full max-w-3xl mx-auto"
      >
        <textarea
          className="w-full p-3 min-h-[100px] max-h-[200px] resize-none overflow-y-auto border border-cyan-400/40 bg-slate-900/80 rounded-xl text-slate-100 placeholder-slate-400 shadow-[0_0_20px_rgba(34,211,238,0.25),inset_0_0_10px_rgba(34,211,238,0.1)] backdrop-blur-md outline-none transition-all duration-300 focus:border-cyan-300/80 focus:shadow-[0_0_30px_rgba(34,211,238,0.5),inset_0_0_15px_rgba(34,211,238,0.2)]"
          rows={4}
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </form>

      {showLoader && <div>Thinking...</div>}
    </div>
  );
}