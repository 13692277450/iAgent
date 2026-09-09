'use client';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({behavior:'smooth'})
  },[messages])

  return (
    // 1. 外层容器：去掉 h-screen 和 overflow-hidden，改用 min-h-screen 让内容自然撑开，页面本体允许滚动！
    // <div className="flex flex-col min-h-screen w-full max-w-3xl mx-auto">
      
      /* 2. 消息展示区：去掉 overflow-y-auto，让高度由内容自然撑开，浏览器的鼠标滚轮会自动滚动整个页面 */
      /* 为了防止内容被底部的输入框遮住，我们保留原本的 pt-24，并在后面加一个 pb-[15px] 作为与输入框的间距 */
      // <div className="flex-1 pt-24 pb-[155px] px-4 no-scrollbar bottom-8">
        <div className="flex-1 pt-24 pb-[175px] px-4">
        <div className="max-w-3xl mx-auto">
        {messages.map(message => (
        <div 
          key={message.id} 
          className={`whitespace-pre-wrap mb-4 flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className={`mb-1 text-xm font-bold ${message.role === 'user' ? 'text-yellow-400' : 'text-slate-400'}`}>
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
                        ? 'bg-gradient-to-br from-yellow-100/20 to-orange-100/10 text-white border-yellow-200/50 shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_0_10px_rgba(255,215,0,0.1)] hover:border-yellow-100/60 hover:shadow-[0_0_20px_rgba(255,215,0,0.6)] max-w-2xl' 
                        : 'bg-slate-900/70 text-slate-100 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.4)]'
                    }`}
                  >
                    {part.text}
                    <div ref={messagesEndRef}/>
                  </div>
                );
              // case 'tool-weather':
              //   return (
              //     <pre key={`${message.id}-${i}`}>
              //       {
              //       // JSON.stringify(part, null, 2)
              //       part.output?.location + ': ' + part.output?.temperature + ' F'
              //       }
              //     </pre>
              //   );
              case 'tool-weather':{
                const location = part.input?.location;
                const temperature = part.output?.temperature;
                return (
                  
                    <div key={`${message.id}-${i}`}>
                      
                        <div className="font-bold text-cyan-400"> 温度查询结果 </div>
                        <div>📍Location: {location} </div>
                        <div className="text-slate-100">🌡️Temperature: {temperature} </div>
                      
                  </div>
                )
              }
              default:
                return null;
            }
            
          })}
        </div>
      ))}
      </div>

      {/* 3. 表单区：保持原样，依然固定在底部，并与消息区保持 15px 间距 */}
            <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
        className="fixed bottom-0 left-0 right-0 flex justify-center pb-[15px] px-4 bg-transparent"
      >
        <textarea
          // 1. resize-none：禁止手动拉拽
          // 2. min-h-[100px]：设置最小高度（相当于原来的3倍左右）
          // 3. max-h-[200px]：设置最大高度，超过后内部自动滚动，不会无限变高挡住上面的消息
          // 4. overflow-y-auto：默认隐藏滚动条，高度超过 max-h 后才出现
          className="w-full max-w-3xl p-3 min-h-[100px] max-h-[200px] resize-none overflow-y-auto border border-cyan-400/40 bg-slate-900/80 rounded-xl text-slate-100 placeholder-slate-400 shadow-[0_0_20px_rgba(34,211,238,0.25),inset_0_0_10px_rgba(34,211,238,0.1)] backdrop-blur-md outline-none transition-all duration-300 focus:border-cyan-300/80 focus:shadow-[0_0_30px_rgba(34,211,238,0.5),inset_0_0_15px_rgba(34,211,238,0.2)] "
          rows={4}
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
          onKeyDown={e => {
            // 支持 Enter 发送，Shift+Enter 换行
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              // 触发表单提交
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </form>
    </div>
  );
}