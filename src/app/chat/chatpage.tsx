/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // 🚨 处理用户消息点击：填充到 textarea
  const handleUserMessageClick = (message: any) => {
    const textContent = message.parts
      ?.filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");

    if (textContent) {
      setInput(textContent);
    }
  };

  // 🚨 处理 AI 消息点击：复制到剪贴板
  const handleAIMessageClick = async (message: any) => {
    const textContent = message.parts
      ?.filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");

    if (textContent) {
      try {
        // 使用浏览器原生的剪贴板 API
        await navigator.clipboard.writeText(textContent);
        // 这里可以做一个简单的反馈，比如弹一个窗，或者 console.log
        console.log("已复制到剪贴板: ", textContent);
      } catch (err) {
        console.error("复制失败: ", err);
      }
    }
  };

  const showLoader =
    status === "streaming" &&
    lastMessage?.role === "assistant" &&
    lastMessage?.parts.length === 0;

  return (
    <div className="h-full w-full flex flex-col items-center">
      <div
        ref={messagesScrollRef}
        className="flex-1 min-h-0 overflow-y-auto w-full chat-scroll"
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`whitespace-pre-wrap mb-4 flex flex-col ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`mb-1 text-sm font-bold ${
                  message.role === "user" ? "text-cyan-600" : "text-orange-900"
                }`}
              >
                {message.role === "user" ? "👨‍💼 USER: " : "🤖 AI: "}
              </div>

              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div
                        key={`${message.id}-${
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          i
                        }`}
                        onClick={
                          message.role === "user"
                            ? () => handleUserMessageClick(message)
                            : () => handleAIMessageClick(message)
                        }
                        title={
                          message.role === "user"
                            ? "Click copy text to input area"
                            : "Click copy text to clipboard"
                        }
                        className={`whitespace-pre-wrap my-2 px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 w-full max-w-3xl ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-cyan-400/20 to-orange-100/10 text-blue border-green-700/50 shadow-[0_0_15px_rgba(61, 124, 196, 0.4),inset_0_0_10px_rgba(255,215,0,0.1)] hover:border-yellow-100/60 hover:shadow-[0_0_20px_rgba(255,215,0,0.6)] max-w-2xl cursor-pointer"
                            : "bg-slate-900/70 text-slate-100 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.4)] cursor-pointer"
                        }`}
                      >
                        {part.text}
                      </div>
                    );

                  case "tool-weather": {
                    const location = part.input?.location;
                    const temperature = part.output?.temperature;
                    return (
                      <div key={`${message.id}-${i}`}>
                        <div className="font-bold text-cyan-400">
                          温度查询结果
                        </div>
                        <div>📍Location: {location}</div>
                        <div className="text-slate-100">
                          🌡️Temperature: {temperature}
                        </div>
                      </div>
                    );
                  }

                  default:
                    return null;
                }
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex-shrink-0 w-full max-w-3xl mx-auto pb-[2px]"
      >
        <textarea
          className="w-full p-3 min-h-[100px] max-h-[200px] resize-none overflow-y-auto border border-cyan-400/40 bg-slate-900/80 rounded-xl text-slate-100 placeholder-slate-400 shadow-[0_0_20px_rgba(34,211,238,0.25),inset_0_0_10px_rgba(34,211,238,0.1)] backdrop-blur-md outline-none transition-all duration-300 focus:border-cyan-300/80 focus:shadow-[0_0_30px_rgba(34,211,238,0.5),inset_0_0_15px_rgba(34,211,238,0.2)]"
          rows={4}
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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
