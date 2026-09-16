/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";
import { useMcp } from "@/components/mcp_provider";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef, memo, useMemo } from "react";
import {
  BrainCircuit,
  Paperclip,
  Mic,
  Globe,
  Send,
  Download,
  Copy,
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
import { log } from "@/lib/logger";

// ==================== LLM Models ====================
type LLMModel = {
  id: number;
  llm_name: string;
  llm_apiKey: string;
  llm_baseUrl: string;
  llm_model: string;
  is_default: boolean;
};

type SystemPrompt = {
  id: number;
  system_prompt_name: string;
  system_prompt_content: string;
  system_prompt_format?: string;
  is_default: boolean;
};

// ==================== Language Mapping ====================
const CODE_LANG_ALIASES: Record<string, string> = {
  py: "python",
  js: "javascript",
  node: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  bashrc: "bash",
  rb: "ruby",
  rs: "rust",
  cs: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  "c-cpp": "cpp",
  htm: "markup",
  html: "markup",
  xml: "markup",
  vue: "markup",
  svg: "markup",
  md: "markdown",
  yml: "yaml",
  toml: "ini",
  shellsession: "shell-session",
};

const FILE_EXT_LANG: Record<string, string> = {
  py: "python",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  ps1: "powershell",
  bat: "batch",
  rb: "ruby",
  rs: "rust",
  go: "go",
  c: "c",
  h: "c",
  cpp: "cpp",
  cxx: "cpp",
  cc: "cpp",
  hpp: "cpp",
  java: "java",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  scala: "scala",
  dart: "dart",
  r: "r",
  lua: "lua",
  pl: "perl",
  pm: "perl",
  sql: "sql",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  ini: "ini",
  md: "markdown",
  markdown: "markdown",
  html: "markup",
  htm: "markup",
  css: "css",
  scss: "scss",
  less: "less",
  xml: "markup",
  vue: "markup",
  dockerfile: "docker",
  gradle: "gradle",
  jl: "julia",
  fs: "fsharp",
  ex: "elixir",
  exs: "elixir",
  hs: "haskell",
  lhs: "haskell",
  clj: "clojure",
  zig: "zig",
  nim: "nim",
  graphql: "graphql",
  diff: "diff",
  makefile: "makefile",
};

const LANG_PLACEHOLDERS = new Set([
  "text",
  "code",
  "plain",
  "txt",
  "content",
  "textblock",
]);

function resolveCodeLang(lang?: string, filename?: string): string {
  const raw = (lang || "").trim().toLowerCase();
  if (!LANG_PLACEHOLDERS.has(raw)) {
    return CODE_LANG_ALIASES[raw] || raw;
  }
  const fileName = (filename || "").trim().toLowerCase();
  const dotIdx = fileName.lastIndexOf(".");
  if (dotIdx !== -1 && dotIdx < fileName.length - 1) {
    const ext = fileName.slice(dotIdx + 1);
    if (FILE_EXT_LANG[ext]) return FILE_EXT_LANG[ext];
  }
  return "text";
}

const FENCED_CODE_RE = /```([a-zA-Z0-9_+.-]*)[ \t]*\r?\n([\s\S]*?)```/g;
const INLINE_CODE_RE = /`([^`\n]+)`/g;

type RichSegment =
  | { kind: "text"; content: string }
  | { kind: "code"; lang: string; content: string };

function splitRichText(text: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;
  FENCED_CODE_RE.lastIndex = 0;
  while ((match = FENCED_CODE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        kind: "text",
        content: text.slice(lastIndex, match.index),
      });
    }
    const lang = (match[1] || "").trim().split(/[\s,]+/)[0];
    segments.push({ kind: "code", lang, content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", content: text.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ kind: "text", content: text }];
}

function renderInlineCode(content: string) {
  const nodes = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;
  let k = 0;
  INLINE_CODE_RE.lastIndex = 0;
  while ((match = INLINE_CODE_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }
    nodes.push(
      <code
        key={`inline-code-${k++}`}
        className="rounded bg-slate-800/80 px-1.5 py-0.5 text-slate-200 text-[0.85em] font-mono"
      >
        {match[1]}
      </code>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }
  return nodes;
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function BoxActions({
  content,
  filename,
  onToast,
}: {
  content: string;
  filename: string;
  onToast: (msg: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={async () => {
          try {
            await copyToClipboard(content);
            onToast("✅ Copied to clipboard");
          } catch (err) {
            onToast("❌ Copy failed");
            console.error("Copy failed", err);
          }
        }}
        title="COPY"
        className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 rounded transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        COPY
      </button>
      <button
        type="button"
        onClick={() => downloadText(content, filename)}
        title="DOWNLOAD"
        className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 rounded transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        DOWNLOAD
      </button>
    </div>
  );
}

function renderRichText(
  text: string,
  isStreaming: boolean,
  onToast: (msg: string) => void,
) {
  const segments = splitRichText(text);
  return segments.map((seg, i) => {
    if (seg.kind === "code") {
      const lang = resolveCodeLang(seg.lang);
      const codeText = seg.content.replace(/\n$/, "");
      const ext = seg.lang.trim() || "txt";
      return (
        <div
          key={`rich-code-${i}`}
          className="my-2 rounded-lg border border-cyan-400/30 bg-slate-950/80 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md w-full"
        >
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-400/20">
            <span className="text-xs font-mono text-cyan-400 uppercase">
              {seg.lang.trim() || "code"}
            </span>
            <BoxActions
              content={codeText}
              filename={`code-${i}.${ext}`}
              onToast={onToast}
            />
          </div>
          <div className="p-3 overflow-x-auto">
            {isStreaming ? (
              <pre className="m-0 p-0 font-mono text-[0.875rem] whitespace-pre-wrap break-words text-slate-100">
                {seg.content}
              </pre>
            ) : (
              <SyntaxHighlighter
                language={lang}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: "transparent",
                  fontSize: "0.875rem",
                }}
                wrapLongLines
              >
                {seg.content}
              </SyntaxHighlighter>
            )}
          </div>
        </div>
      );
    }
    const textContent = seg.content;
    return (
      <div
        key={`rich-text-${i}`}
        className="my-2 rounded-lg border border-cyan-400/30 bg-slate-950/80 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md w-full"
      >
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-400/20">
          <span className="text-xs font-mono text-cyan-400 uppercase">
            TEXT
          </span>
          <BoxActions
            content={textContent}
            filename={`text-${i}.txt`}
            onToast={onToast}
          />
        </div>
        <div className="p-4 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {renderInlineCode(textContent)}
        </div>
      </div>
    );
  });
}

const AIMessageText = memo(function AIMessageText({
  text,
  isStreaming,
  onToast,
}: {
  text: string;
  isStreaming: boolean;
  onToast: (msg: string) => void;
}) {
  return <>{renderRichText(text, isStreaming, onToast)}</>;
});

export default function Chat() {
  const { selected } = useMcp();

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const [input, setInput] = useState("");
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deepThink, setDeepThink] = useState(false);

  // ==================== System Prompts ====================
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedSystemPrompt, setSelectedSystemPrompt] =
    useState<SystemPrompt | null>(null);

  // ==================== LLM Models ====================
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);

  // ==================== Transport（body 用函数形式，每次请求取最新值）====================
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => {
          const body = {
            deepThink,
            selectedSystemPrompt: selectedSystemPrompt?.system_prompt_content,
            llm_apiKey: selectedModel?.llm_apiKey,
            llm_baseUrl: selectedModel?.llm_baseUrl,
            llm_model: selectedModel?.llm_model,
            mcpServers: selected.map((s) => ({
              id: s.id,
              name: s.name,
              connection_type: s.connection_type,
              connection_api: s.connection_api,
              auth_type: s.auth_type,
              auth_config: s.auth_config,
              tools: s.tools,
            })),
          };
          // log("[TRANSPORT] 实际发送 body:", body);
          return body;
        },
      }),
    [deepThink, selectedModel, selectedSystemPrompt, selected],
  );

  // 🚨 useChat 用 memo 化的 transport，sendMessage 不再传 body
  const { messages, sendMessage, status } = useChat({ transport });

  const lastMessage = messages[messages.length - 1];

  // ==================== Fetch System Prompts ====================
  useEffect(() => {
    let cancelled = false;
    fetch("/api/system_prompts")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: SystemPrompt[] = data.system_prompts ?? [];
        setSystemPrompts(list);
        const defaultPrompt = list.find((sp) => sp.is_default) ?? list[0];
        if (defaultPrompt) {
          setSelectedSystemPrompt(defaultPrompt);
          log("Default system prompt: ", defaultPrompt.system_prompt_content);
        }
      })
      .catch((err) => log("Failed to fetch system prompts", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // ==================== Fetch LLM Models ====================
  useEffect(() => {
    let cancelled = false;
    fetch("/api/llm")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: LLMModel[] = data.models ?? [];
        setModels(list);
        const defaultModel = list.find((m) => m.is_default) ?? list[0];
        if (defaultModel) {
          setSelectedModel(defaultModel);
          log("Default model: ", defaultModel.llm_model);
        }
      })
      .catch((err) => log("Failed to fetch models", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // ==================== Auto Scroll to Bottom ====================
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleUserMessageClick = (message: any) => {
    const textContent = message.parts
      ?.filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");

    if (textContent) {
      setInput(textContent);
    }
  };

  // ==================== Submission ====================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) {
      showToast("❌ Please select a model");
      return;
    }
    if (!input.trim()) {
      return;
    }
    log("=== Submission Parameters ===", {
      deepThink,
      model: selectedModel.llm_model,
      llm_baseUrl: selectedModel.llm_baseUrl,
      systemPrompt: selectedSystemPrompt?.system_prompt_name,
      mcpServers: selected.map((s) => s.name),
    });

    // 🚨 只传 message，body 在 transport 里
    sendMessage({ text: input });
    setInput("");
  };

  const handleAIMessageClick = async (message: any) => {
    const textContent = message.parts
      ?.filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");

    if (textContent) {
      try {
        await copyToClipboard(textContent);
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
                    const rawLang = (part.input as any)?.language ?? "";
                    const filename =
                      (part.input as any)?.filename ??
                      `ai-output-${message.id}-${i}.txt`;
                    const lang = resolveCodeLang(rawLang, filename);

                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className="w-full max-w-3xl my-2"
                      >
                        <div className="rounded-lg border border-cyan-400/30 bg-slate-950/80 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md">
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-400/20">
                            <span className="text-xs font-mono text-cyan-400 uppercase">
                              {lang || "code"}
                            </span>
                            <BoxActions
                              content={content}
                              filename={filename}
                              onToast={showToast}
                            />
                          </div>
                          <div className="p-3 text-sm text-slate-100 overflow-x-auto">
                            <SyntaxHighlighter
                              language={lang}
                              style={oneDark}
                              customStyle={{
                                margin: 0,
                                padding: 0,
                                background: "transparent",
                                fontSize: "0.875rem",
                              }}
                              wrapLongLines
                            >
                              {content}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  case "text": {
                    const text = part.text;
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
                    return (
                      <AIMessageText
                        key={`${message.id}-${i}`}
                        text={text}
                        isStreaming={
                          message.id === lastMessage?.id &&
                          status === "streaming"
                        }
                        onToast={showToast}
                      />
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
                          WEATHER QUERY RESULTS
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
        onSubmit={handleSubmit}
        className="flex-shrink-0 w-full max-w-3xl mx-auto pb-[2px] bg-slate-950 rounded-xl"
      >
        <textarea
          className="w-full p-3 min-h-[100px] max-h-[200px] resize-none overflow-y-auto border border-cyan-400/40 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-400 shadow-[0_0_20px_rgba(34,211,238,0.25),inset_0_0_10px_rgba(34,211,238,0.1)] backdrop-blur-md outline-none transition-all duration-300 focus:border-cyan-300/80 focus:shadow-[0_0_30px_rgba(34,211,238,0.5),inset_0_0_15px_rgba(34,211,238,0.2)]"
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

        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            {/* 1. DeepThink Switch */}
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setDeepThink(!deepThink);
                log(`DeepThink switched: ${!deepThink}`);
              }}
              className={`h-8 px-3 rounded-lg text-xs border transition-all ${
                deepThink
                  ? "bg-cyan-500/30 text-cyan-400 border-cyan-600/80 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:bg-cyan-500/40"
                  : "bg-slate-900/60 text-slate-100 border-cyan-400/20 hover:bg-cyan-500/10 hover:border-cyan-200/40"
              }`}
            >
              <BrainCircuit className="w-4 h-4 mr-1.5" />
              {deepThink ? "DeepThink On" : "DeepThink Off"}
            </Button>

            {/* 2. System Prompt Selection */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-600/60 transition-all">
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
                      log(`System prompt name: ${sp.system_prompt_name}`);
                    }}
                    className={`cursor-pointer text-xs outline-none transition-colors focus:bg-cyan-500/20 focus:text-cyan-100 ${
                      selectedSystemPrompt?.id === sp.id
                        ? "bg-cyan-200/10 text-cyan-500"
                        : ""
                    }`}
                  >
                    📜 {sp.system_prompt_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. Attachment Upload */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-white-300/40"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {/* 4. Voice Input */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <Mic className="w-4 h-4" />
            </Button>

            {/* 5. Internet Search */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyan-600 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-300/40"
            >
              <Globe className="w-4 h-4" />
            </Button>

            {/* 6. Model Selection */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all">
                <Cpu className="w-4 h-4 mr-1.5" />
                {selectedModel?.llm_model ?? "Select Model"}
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
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer text-xs outline-none transition-colors focus:bg-cyan-500/20 focus:text-cyan-100 ${
                      selectedModel?.id === m.id
                        ? "bg-cyan-500/10 text-cyan-300"
                        : ""
                    }`}
                  >
                    🚀 {m.llm_model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm border backdrop-blur-md transition-all duration-300 ${
          toast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        } ${
          toast.message.startsWith("✅")
            ? "bg-cyan-500/20 text-cyan-100 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            : "bg-red-500/20 text-red-100 border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}
