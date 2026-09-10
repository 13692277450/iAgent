/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import {
  BrainCircuit,
  Bot,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Globe,
  Send,
  Code2,
  PenLine,
  Puzzle,
  Download,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];
  const [deepThink, setDeepThink] = useState(false);
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
        console.log("Already copied to clipboard: ", textContent);
      } catch (err) {
        console.error("Copy failed to clipboard: ", err);
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
                {message.role === "user" ? "👨‍💼 " : "🤖"}
              </div>

              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "tool-render_output": {
                    const content = (part.input as any)?.content ?? "";
                    const language = (part.input as any)?.language ?? "text";
                    const filename =
                      (part.input as any)?.filename ??
                      `ai-output-${message.id}-${i}.txt`;

                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className="w-full max-w-3xl my-2"
                      >
                        <div className="rounded-lg border border-cyan-400/30 bg-slate-950/80 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md">
                          {/* 顶部菜单栏 */}
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-400/20">
                            <span className="text-xs font-mono text-cyan-400 uppercase">
                              {language}
                            </span>

                            <div className="flex items-center gap-1">
                              {/* 复制按钮 */}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(
                                      content,
                                    );
                                    alert("Copied to clipboard");
                                  } catch (err) {
                                    console.error("复制失败", err);
                                  }
                                }}
                                title="复制"
                                className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 rounded transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                复制
                              </button>

                              {/* 下载按钮 */}
                              <button
                                type="button"
                                onClick={() => {
                                  const blob = new Blob([content], {
                                    type: "text/plain;charset=utf-8",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = filename;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                title="下载"
                                className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 rounded transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                下载
                              </button>
                            </div>
                          </div>

                          {/* 文本框内容 */}
                          <div className="p-4 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                            {content}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  case "text": {
                    const text = part.text;

                    // ================= 用户消息：保持原样 =================
                    if (message.role === "user") {
                      return (
                        <div
                          key={`${message.id}-${i}`}
                          onClick={() => handleUserMessageClick(message)}
                          title="Click copy text to input area"
                          className="whitespace-pre-wrap my-2 px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 w-full max-w-2xl bg-gradient-to-br from-cyan-400/20 to-orange-100/10 text-blue border-green-700/50 shadow-[0_0_15px_rgba(61,124,196,0.4),inset_0_0_10px_rgba(255,215,0,0.1)] hover:border-yellow-100/60 hover:shadow-[0_0_20px_rgba(255,215,0,0.6)] cursor-pointer"
                        >
                          {text}
                        </div>
                      );
                    }

                    // ================= AI 消息：嵌入文本框 =================
                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className="whitespace-pre-wrap my-2 w-full max-w-3xl"
                      >
                        <div className="rounded-lg border border-cyan-400/30 bg-slate-950/80 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md">
                          {/* 顶部菜单栏 */}
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-400/20">
                            <span className="text-xs font-mono text-cyan-400 uppercase">
                              AI OUTPUT
                            </span>

                            <div className="flex items-center gap-1">
                              {/* 🚨 复制按钮：加上 type="button" */}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(text);
                                    alert("Copied to clipboard");
                                  } catch (err) {
                                    console.error("复制失败", err);
                                  }
                                }}
                                title="复制"
                                className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 rounded transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                复制
                              </button>

                              {/* 🚨 下载按钮：加上 type="button" */}
                              <button
                                type="button"
                                onClick={() => {
                                  const blob = new Blob([text], {
                                    type: "text/plain;charset=utf-8",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `ai-output-${message.id}-${i}.txt`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                title="下载"
                                className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 rounded transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                下载
                              </button>
                            </div>
                          </div>

                          {/* 文本框内容 */}
                          <div className="p-4 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {text}
                          </div>
                        </div>
                      </div>
                    );
                  }

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
        {/* 输入框 */}
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

        {/* 🚨 工具栏区域 */}
        <div className="flex items-center justify-between mt-3 px-1">
          {/* 左侧功能区 */}
          <div className="flex items-center gap-2">
            {/* 1. DeepThink 开关 */}
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDeepThink(!deepThink)}
              className={`h-8 px-3 rounded-lg text-xs border transition-all ${
                deepThink
                  ? "bg-cyan-500/30 text-cyan-700 border-cyan-600/80 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:bg-cyan-500/40"
                  : "bg-slate-900/60 text-slate-100 border-cyan-400/20 hover:bg-cyan-500/10 hover:border-cyan-200/40"
              }`}
            >
              <BrainCircuit className="w-4 h-4 mr-1.5" />
              {deepThink ? "DeepThink On" : "DeepThink Off"}
            </Button>

            {/* 2. Agent 模式选择 */}
            <div className="flex items-center bg-slate-900/60 border border-cyan-400/30 rounded-lg overflow-hidden">
              <button
                type="button"
                className="h-8 px-3 text-xs text-cyan-300 bg-cyan-500/20"
              >
                <Code2 className="w-3.5 h-3.5 inline mr-1" /> CODE
              </button>
              <div className="w-px h-4 bg-cyan-400/30" />
              <button
                type="button"
                className="h-8 px-3 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <PenLine className="w-3.5 h-3.5 inline mr-1" /> ASSIST
              </button>
              <div className="w-px h-4 bg-cyan-400/30" />
              <button
                type="button"
                className="h-8 px-3 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <Puzzle className="w-3.5 h-3.5 inline mr-1" /> WRITE
              </button>
            </div>

            {/* 3. 附件 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* 4. 粘贴图片 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>

            {/* 5. 语音 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <Mic className="w-4 h-4" />
            </Button>

            {/* 6. 联网搜索 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <Globe className="w-4 h-4" />
            </Button>
          </div>

          {/* 右侧发送按钮 */}
          <Button
            type="submit"
            className="h-8 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all"
          >
            <Send className="w-4 h-4 mr-1.5" />
            SEND
          </Button>
        </div>
      </form>

      {showLoader && <div>Thinking...</div>}
    </div>
  );
}
