/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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
  Code,
  BookAIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DefaultChatTransport } from "ai";
import language from "react-syntax-highlighter/dist/cjs/languages/hljs/1c";
export default function Chat() {
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("AISSTANT");
  const [model, setModel] = useState("deepseek-v4-flash");
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deepThink, setDeepThink] = useState(false);
  const langMap: Record<string, string> = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    sh: "bash",
    html: "html",
    css: "css",
    xml: "xml",
    json: "json",
    yaml: "yaml",
    md: "markdown",
    sql: "sql",
    php: "php",
    ruby: "ruby",
    go: "go",
    rb: "ruby",
    cpp: "cpp",
    c: "c",
    java: "java",
    csharp: "csharp",
    cs: "csharp",
  };
  const normalizedLang = langMap[language] || language || "text";
  // 系统提示选择System Prompt上拉菜单
  const [systemPrompts, setSystemPrompts] = useState<
    {
      id: number;
      system_prompt_name: string;
      system_prompt_content: string;
      system_prompt_format?: string;
    }[]
  >([]);

  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<{
    id: number;
    system_prompt_name: string;
    system_prompt_content: string;
  } | null>(null);

  // 页面加载时拉取 system prompt 列表
  useEffect(() => {
    fetch("/api/system_prompts")
      .then((res) => res.json())
      .then((data) => {
        setSystemPrompts(data.system_prompts); // ✅ 用 data.system_prompts
        if (data.system_prompts.length > 0) {
          setSelectedSystemPrompt(data.system_prompts[0]);
        }
      })
      .catch((err) => console.error("Failed to fetch system prompts", err));
  }, []);

  // 系统提示选择LLM上拉菜单
  const [selectedModel, setSelectedModel] = useState<{
    id: number;
    llm_name: string;
    llm_apiKey: string;
    llm_baseUrl: string;
    llm_model: string;
  } | null>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // 🚨 在这里把 deepThink 作为 body 的一部分传给后端
      body: {
        deepThink,
        selectedSystemPrompt: selectedSystemPrompt?.system_prompt_content,
        llm_apiKey: selectedModel?.llm_apiKey,
        llm_baseUrl: selectedModel?.llm_baseUrl,
        llm_model: selectedModel?.llm_model,
      },
    }),
  });
  const lastMessage = messages[messages.length - 1];
  const [models, setModels] = useState<
    {
      id: number;
      llm_name: string;
      llm_apiKey: string;
      llm_baseUrl: string;
      llm_model: string;
    }[]
  >([]);

  // 页面加载时拉取模型列表
  useEffect(() => {
    fetch("/api/llm")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models);
        if (data.models.length > 0) setSelectedModel(data.models[0]);
      })
      .catch((err) => console.error("Failed to fetch models", err));
  }, []);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el && messages.length > 0) {
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

  // 提交时把 deepThink 作为第二个参数传进去
  const handleDeepThinkingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(
      { text: input },
      { body: { deepThink } }, // 🚨 每次发送时动态传入
    );
    setInput("");
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
                  case "reasoning": {
                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className="w-full max-w-3xl my-2"
                      >
                        <details className="rounded-lg border border-gray-800/30 bg-black-750/20 backdrop-blur-md overflow-hidden">
                          <summary className="px-3 py-2 text-xs text-blue-600 cursor-pointer hover:bg-purple-500/10 transition-colors">
                            💬 AI DeepThinking
                          </summary>
                          <div className="p-3 text-sm text-black-600/80 whitespace-pre-wrap leading-relaxed border-t border-purple-400/20">
                            {part.text}
                          </div>
                        </details>
                      </div>
                    );
                  }
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
                          <div className="p-4 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                            <SyntaxHighlighter
                              language={language || "text"}
                              style={oneDark}
                              customStyle={{
                                margin: 0,
                                padding: 0,
                                background: "transparent",
                                fontSize: "0.875rem",
                              }}
                              wrapLongLines
                            >
                              {text}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  case "tool-weather": {
                    const input = part.input as { location?: string };
                    const output = part.output as { temperature?: number };
                    const location = input?.location;
                    const temperature = output?.temperature;
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
          sendMessage({
            text: input,
          });
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
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all">
                <BookAIcon className="w-4 h-4 mr-1.5" />
                {selectedSystemPrompt?.system_prompt_name ?? "System Prompt"}
                <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="w-56 bg-slate-900 border border-cyan-400/30 text-slate-100 shadow-[0_0_20px_rgba(34,211,238,0.3)] backdrop-blur-md"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-cyan-400">
                    SYSTEM PROMPT
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-cyan-400/20" />

                {systemPrompts.map((sp) => (
                  <DropdownMenuItem
                    key={sp.id}
                    onClick={() => {
                      setSelectedSystemPrompt(sp);
                    }}
                    className={`cursor-pointer text-xs outline-none transition-colors focus:bg-cyan-500/20 focus:text-cyan-100 ${
                      selectedSystemPrompt?.id === sp.id
                        ? "bg-cyan-500/10 text-cyan-300"
                        : "No Name"
                    }`}
                  >
                    📜 {sp.system_prompt_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. 附件 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* 4. 粘贴图片 */}
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <ImageIcon className="w-4 h-4" />
            </Button> */}

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
            {/* 7. 模型选择下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all">
                <Cpu className="w-4 h-4 mr-1.5" />
                {model}
                <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="w-56 bg-slate-900 border border-cyan-400/30 text-slate-100 shadow-[0_0_20px_rgba(34,211,238,0.3)] backdrop-blur-md"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-cyan-400">
                    SELECT MODEL
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-cyan-400/20" />

                {models.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m);
                      setModel(m.llm_model);
                    }}
                    className={`cursor-pointer text-xs outline-none transition-colors focus:bg-cyan-500/20 focus:text-cyan-100 ${
                      model === m.llm_model
                        ? "bg-cyan-500/10 text-cyan-300"
                        : "No Name"
                    }`}
                  >
                    🚀 {m.llm_model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
