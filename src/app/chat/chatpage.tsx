/** biome-ignore-all assist/source/organizeImports: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useMcp } from "@/components/mcp_provider";
import { useSkills } from "@/components/assistant-ui/elements/skills-provider";
import { useConversation } from "@/components/conversation-provider";
import {
  AssistantRuntimeProvider,
  useAuiState,
  useAui,
} from "@assistant-ui/react";
import { WebSpeechDictationAdapter } from "@assistant-ui/react";

import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { DefaultChatTransport } from "ai";
import { log, LogLevel, logWithColor, styledLog } from "@/lib/logger";

import {
  BrainCircuit,
  Mic,
  Globe,
  Save,
  Cpu,
  BookAIcon,
  ChevronDown,
  Plus,
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
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import stream from "node:stream";

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

// ============================================================
// 外层：状态管理
// ============================================================
export default function ChatPage() {
  const [enableRAG, setEnableRAG] = useState(false);
  const [enableMic, setEnableMic] = useState(false);
  const { selected } = useMcp();
  const { selected: selectedSkills } = useSkills();

  const [deepThink, setDeepThink] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedSystemPrompt, setSelectedSystemPrompt] =
    useState<SystemPrompt | null>(null);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const MAX_MESSAGES = 10;
  const [enableSearch, setEnableSearch] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: (options: any) => {
          // 防御性检查：确保 messages 是数组
          const allMessages = options?.messages ?? [];
          const trimmedMessages =
            Array.isArray(allMessages) && allMessages.length > MAX_MESSAGES
              ? allMessages.slice(-MAX_MESSAGES)
              : allMessages;

          return {
            messages: trimmedMessages,
            deepThink,
            selectedSystemPrompt: selectedSystemPrompt?.system_prompt_content,
            llm_apiKey: selectedModel?.llm_apiKey,
            llm_baseUrl: selectedModel?.llm_baseUrl,
            llm_model: selectedModel?.llm_model,
            llm_enable_search: enableSearch,
            llm_enable_rag: enableRAG,
            llm_enable_mic: enableMic,
            mcpServers: Array.isArray(selected)
              ? selected.map((s) => ({
                  id: s.id,
                  name: s.name,
                  connection_type: s.connection_type,
                  connection_api: s.connection_api,
                  auth_type: s.auth_type,
                  auth_config: s.auth_config,
                  tools: s.tools,
                }))
              : [],
            skills: Array.isArray(selectedSkills)
              ? selectedSkills.map((s) => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  input_schema: s.input_schema,
                  output_schema: s.output_schema,
                  handler_type: s.handler_type,
                  endpoint: s.endpoint,
                  handler_ref: s.handler_ref,
                  auth_type: s.auth_type,
                }))
              : [],
          };
        },
      }),
    [
      deepThink,
      selectedModel,
      selectedSystemPrompt,
      selected,
      selectedSkills,
      enableSearch,
      enableRAG,
      enableMic,
    ],
  );

  const runtime = useChatRuntime({
    transport,
    adapters: {
      dictation: WebSpeechDictationAdapter.isSupported()
        ? new WebSpeechDictationAdapter({
            language: "zh-CN", // 默认跟随浏览器语言，建议显式设为中文
            continuous: true, // 停顿后继续录音（默认 true）
            interimResults: true, // 实时返回中间结果，边说话边出字
          })
        : undefined,
    },
    onData: (dataPart) => {
      if (dataPart.type === "data-log") {
        const data = dataPart.data as {
          level: string;
          text: string;
          color?: string;
          time: string;
        };
        logWithColor(
          (data.level?.toLowerCase() ?? "log") as LogLevel,
          data.text,
          data.color,
        );
      }
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatInner
        deepThink={deepThink}
        setDeepThink={setDeepThink}
        systemPrompts={systemPrompts}
        setSystemPrompts={setSystemPrompts}
        selectedSystemPrompt={selectedSystemPrompt}
        setSelectedSystemPrompt={setSelectedSystemPrompt}
        models={models}
        setModels={setModels}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        enableSearch={enableSearch}
        setEnableSearch={setEnableSearch}
        enableRAG={enableRAG}
        setEnableRAG={setEnableRAG}
        enableMic={enableMic}
        setEnableMic={setEnableMic}
      />
    </AssistantRuntimeProvider>
  );
}

// ============================================================
// Inner：UI + 恢复逻辑
// ============================================================
type ChatInnerProps = {
  deepThink: boolean;
  setDeepThink: (v: boolean) => void;
  systemPrompts: SystemPrompt[];
  setSystemPrompts: (v: SystemPrompt[]) => void;
  selectedSystemPrompt: SystemPrompt | null;
  setSelectedSystemPrompt: (v: SystemPrompt | null) => void;
  models: LLMModel[];
  setModels: (v: LLMModel[]) => void;
  selectedModel: LLMModel | null;
  setSelectedModel: (v: LLMModel | null) => void;
  enableSearch: boolean;
  setEnableSearch: (v: boolean) => void;
  enableRAG: boolean;
  setEnableRAG: (v: boolean) => void;
  enableMic: boolean;
  setEnableMic: (v: boolean) => void;
};

function ChatInner({
  deepThink,
  setDeepThink,
  systemPrompts,
  setSystemPrompts,
  selectedSystemPrompt,
  setSelectedSystemPrompt,
  models,
  setModels,
  selectedModel,
  setSelectedModel,
  enableSearch,
  setEnableSearch,
  enableRAG,
  setEnableRAG,
  enableMic,
  setEnableMic,
}: ChatInnerProps) {
  const { triggerRefresh, restoreId, clearRestore, requestRestore } =
    useConversation();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);

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

  const messages = useAuiState((s) => s.thread.messages);
  const aui = useAui();
  // 底层 AI SDK useChat 实例（由 useAISDKRuntime 通过 extras 提供），
  // 恢复历史会话时直接注入消息，这是与适配器内部一致的受支持方式
  const chat = useAuiState(
    (s) =>
      s.thread.extras as
        | { chat?: { setMessages: (m: any) => void } }
        | undefined,
  )?.chat;

  // ============================================================
  // 恢复历史 / 新建会话
  // ============================================================
  // 记录最近一次恢复请求，避免快速连续点击时旧请求覆盖新请求
  const restoreSeqRef = useRef(0);

  useEffect(() => {
    // 没有要恢复的 ID，直接跳过
    if (restoreId === null) return;

    const seq = ++restoreSeqRef.current;
    const isLatest = () => restoreSeqRef.current === seq;
    const done = () => {
      if (isLatest()) clearRestore();
    };

    // 1. 新建会话：ID 为 0
    if (restoreId === 0) {
      console.log("[restore] 创建新会话");
      if (chat && typeof chat.setMessages === "function") {
        chat.setMessages([]);
      } else {
        aui.thread().reset();
      }
      setConversationId(null);
      done();
      return;
    }

    // 2. 恢复历史会话
    console.log(`[CONVERSATION] Recover conversation ID: ${restoreId}`);
    log(`[CONVERSATION] Recover conversation ID: ${restoreId}`);

    (async () => {
      try {
        let data: any;
        try {
          const res = await fetch(`/api/conversation/${restoreId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          data = await res.json();
        } catch (err) {
          console.error("[restore] Failed to fetch conversation data:", err);
          if (isLatest()) showToast("❌ " + t("chat.restoreFailed"));
          return;
        }

        // 防御性检查：确保 messages 存在且是数组
        const rawMessages = data?.messages;
        if (!Array.isArray(rawMessages)) {
          console.warn(
            "[restore] Invalid messages array in conversation data",
            data,
          );
          if (isLatest()) showToast("❌ " + t("chat.restoreFailed"));
          return;
        }

        if (!chat || typeof chat.setMessages !== "function") {
          console.error("[restore] Bottom chat instance not available");
          if (isLatest()) showToast("❌ " + t("chat.restoreFailed"));
          return;
        }

        // Convert raw messages to UIMessage format for AI SDK ({ id, role, parts, createdAt })
        const uiMessages = rawMessages
          .filter(
            (m: any) =>
              m &&
              typeof m === "object" &&
              (m.role === "user" || m.role === "assistant"),
          )
          .map((m: any, idx: number) => {
            let text = "";

            try {
              if (typeof m.content === "string") {
                text = m.content;
              } else if (m.parts) {
                // Process parts string if it's a JSON string
                const parts =
                  typeof m.parts === "string" ? JSON.parse(m.parts) : m.parts;

                if (Array.isArray(parts)) {
                  text = parts
                    .filter(
                      (p: any) =>
                        p && typeof p === "object" && p.type === "text",
                    )
                    .map((p: any) => p.text || "")
                    .join("");
                }
              } else if (m.text) {
                text = String(m.text);
              }
            } catch (e) {
              console.warn(
                `[restore] Failed to parse message content for message ${idx}`,
                e,
              );
              text = "[parse failed]";
            }

            return {
              id: String(
                m.id ||
                  `restored-${idx}), 
                // -${Date.now()}`,
              ),
              role: m.role,
              createdAt:
                m.created_at || m.createdAt
                  ? new Date(m.created_at || m.createdAt)
                  : new Date(),
              parts: [{ type: "text", text: text || "" }],
            };
          })
          .filter((m: any) => {
            // Filter out empty text messages
            const hasText = m.parts?.some((p: any) => p.text?.trim());
            return hasText || m.role === "assistant";
          });

        console.log(`[restore] 成功解析 ${uiMessages.length} 条消息`);

        if (!isLatest()) return;

        // 关键步骤：直接设置 AI SDK chat 的消息。
        // 不能用 aui.thread().reset()：AI SDK 适配器要求消息带有内部绑定，
        // reset() 生成的新消息会被 getExternalStoreMessages 解析为空数组，
        // 反而把消息清空。
        chat.setMessages(uiMessages);

        setConversationId(restoreId as any);
        showToast(`✅ Restored ${uiMessages.length} messages`);
      } catch (err) {
        console.error("[restore] Unknown error:", err);
        if (isLatest())
          showToast(
            "❌ " + t("chat.restoreFailed") + ": " + (err as Error).message,
          );
      } finally {
        done();
      }
    })();
  }, [restoreId, clearRestore, chat, aui]);

  // Load system prompts
  useEffect(() => {
    fetch("/api/system_prompts")
      .then((r) => r.json())
      .then((data) => {
        const list: SystemPrompt[] = Array.isArray(data?.system_prompts)
          ? data.system_prompts
          : [];
        setSystemPrompts(list);
        setSelectedSystemPrompt(
          list.find((sp) => sp.is_default) ?? list[0] ?? null,
        );
      })
      .catch((err) => log("Failed to fetch system prompts", err));
  }, []); // Remove unnecessary dependency

  // Load LLM models
  useEffect(() => {
    fetch("/api/llm")
      .then((r) => r.json())
      .then((data) => {
        const list: LLMModel[] = Array.isArray(data?.models) ? data.models : [];
        setModels(list);
        setSelectedModel(list.find((m) => m.is_default) ?? list[0] ?? null);
      })
      .catch((err) => log("Failed to fetch models", err));
  }, []);

  // Save conversation
  const handleSave = async () => {
    // Make sure messages exist
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      showToast("❌ " + t("chat.noMessages"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/conversation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          model: selectedModel?.llm_model,
          systemPrompt: selectedSystemPrompt?.system_prompt_name,
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
          })),
        }),
      });
      const data = await res.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
        triggerRefresh();
        showToast("✅ " + t("chat.conversationSaved"));
      } else {
        showToast("❌ " + t("chat.saveFailed"));
      }
    } catch (err) {
      showToast("❌ " + t("chat.saveFailed"));
      log("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  // 新会话
  // const handleNewChat = () => {
  //   requestRestore(0); // Trigger restore with restoreId = 0
  //   setConversationId(null);
  // };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Thread
          composerToolbar={
            <div className="flex items-center gap-2 flex-wrap">
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="h-8 text-xs text-cyan-300 bg-slate-900/60 border border-cyan-400/30 hover:bg-cyan-500/10"
                title="New Conversation"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                NEW
              </Button> */}

              {/* DeepThink */}
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  const next = !deepThink;
                  setDeepThink(next);
                  log(`[DEEP_THINK] DeepThink shifted: ${next}`);
                }}
                className={`h-8 px-3 rounded-lg text-xs border transition-all ${
                  deepThink
                    ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/25"
                    : "bg-card text-muted-foreground border-border shadow-sm hover:bg-muted hover:text-foreground"
                }`}
              >
                <BrainCircuit className="w-4 h-4 mr-1.5" />
                {deepThink ? t("chat.deepThinkOn") : t("chat.deepThinkOff")}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs border bg-card text-foreground border-border shadow-sm hover:bg-muted transition-colors">
                  <BookAIcon className="w-4 h-4 mr-1.5 text-cyan-600 dark:text-cyan-400" />
                  {selectedSystemPrompt?.system_prompt_name ?? t("chat.prompt")}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-popover text-popover-foreground border-border shadow-lg"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-cyan-600 dark:text-cyan-400">
                      {t("chat.systemPrompt")}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {systemPrompts.map((sp) => (
                    <DropdownMenuItem
                      key={sp.id}
                      onClick={() => {
                        setSelectedSystemPrompt(sp);
                        log(
                          `[SYSTEM] System Prompt: ${sp.system_prompt_content}`,
                        );
                      }}
                      className={`cursor-pointer text-xs ${
                        selectedSystemPrompt?.id === sp.id
                          ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                          : ""
                      }`}
                    >
                      📜 {sp.system_prompt_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs border bg-card text-foreground border-border shadow-sm hover:bg-muted transition-colors">
                  <Cpu className="w-4 h-4 mr-1.5 text-cyan-600 dark:text-cyan-400" />
                  {selectedModel?.llm_model ?? t("chat.model")}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-popover text-popover-foreground border-border shadow-lg"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-cyan-600 dark:text-cyan-400">
                      {t("chat.selectModel")}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {models.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m);
                        log(`[MODEL] Model Shifted To: ${m.llm_model}`);
                      }}
                      className={`cursor-pointer text-xs ${
                        selectedModel?.id === m.id
                          ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                          : ""
                      }`}
                    >
                      🚀 {m.llm_model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={saving || !messages || messages.length === 0}
                className="h-8 text-xs bg-card text-foreground border border-border shadow-sm hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5 mr-1 text-cyan-600 dark:text-cyan-400" />
                {saving ? t("common.saving") : t("chat.save")}
              </Button>

              {/* <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = !enableMic;
                  setEnableMic(next);
                  log(`[MIC] Mic Set: ${next}`);
                }}
                title={enableMic ? t("chat.micOn") : t("chat.micOff")}
                className={`h-8 w-8 transition-colors ${
                  enableMic
                    ? "text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                    : "text-muted-foreground bg-card border border-border hover:bg-muted"
                }`}
              >
                <Mic className="w-4 h-4" />
              </Button> */}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = !enableSearch;
                  setEnableSearch(next);
                  log(`[SEARCH] Search Internet Set: ${next}`);
                }}
                title={
                  enableSearch ? t("chat.internetOn") : t("chat.internetOff")
                }
                className={`h-8 w-8 transition-colors ${
                  enableSearch
                    ? "text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                    : "text-muted-foreground bg-card border border-border hover:bg-muted"
                }`}
              >
                <Globe className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = !enableRAG;
                  setEnableRAG(next);
                  styledLog(
                    `[RAG] RAG Set: ${next}`,
                    next
                      ? "color: #22d3ee; font-weight: bold"
                      : "color: #9F9207",
                    next ? "info" : "log",
                  );
                }}
                title={enableRAG ? t("chat.ragOn") : t("chat.ragOff")}
                className={`h-8 w-8 transition-colors ${
                  enableRAG
                    ? "text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                    : "text-muted-foreground bg-card border border-border hover:bg-muted"
                }`}
              >
                <BookAIcon className="w-4 h-4" />
              </Button>
            </div>
          }
        />
      </div>

      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm border backdrop-blur-md transition-all duration-300 ${
          toast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        } ${
          toast.message.startsWith("✅") || toast.message.includes("success")
            ? "bg-cyan-500/20 text-cyan-100 border-cyan-400/50"
            : "bg-red-500/20 text-red-100 border-red-400/50"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}

// ============================================================
// Before restore conversation ok
// ============================================================
// /** biome-ignore-all assist/source/organizeImports: <explanation> */
// /** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
// "use client";

// import { useEffect, useState, useMemo, useRef } from "react";
// import { useMcp } from "@/components/mcp_provider";
// import { useSkills } from "@/components/assistant-ui/elements/skills-provider";
// import { useConversation } from "@/components/conversation-provider";
// import {
//   AssistantRuntimeProvider,
//   useAuiState,
//   useAui,
// } from "@assistant-ui/react";
// import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
// import { Thread } from "@/components/assistant-ui/elements/thread.aui";
// import { DefaultChatTransport } from "ai";
// import { log, LogLevel, logWithColor, styledLog } from "@/lib/logger";

// import {
//   BrainCircuit,
//   Mic,
//   Globe,
//   Save,
//   Cpu,
//   BookAIcon,
//   ChevronDown,
//   Plus,
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuGroup,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";

// type LLMModel = {
//   id: number;
//   llm_name: string;
//   llm_apiKey: string;
//   llm_baseUrl: string;
//   llm_model: string;
//   is_default: boolean;
// };

// type SystemPrompt = {
//   id: number;
//   system_prompt_name: string;
//   system_prompt_content: string;
//   system_prompt_format?: string;
//   is_default: boolean;
// };

// // ============================================================
// // Outer component
// // ============================================================
// export default function ChatPage() {
//   const [enableRAG, setEnableRAG] = useState(false);
//   const [enableMic, setEnableMic] = useState(false);
//   const { selected } = useMcp();
//   const { selected: selectedSkills } = useSkills();

//   const [deepThink, setDeepThink] = useState(false);
//   const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
//   const [selectedSystemPrompt, setSelectedSystemPrompt] =
//     useState<SystemPrompt | null>(null);
//   const [models, setModels] = useState<LLMModel[]>([]);
//   const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
//   const MAX_MESSAGES = 10;
//   const [enableSearch, setEnableSearch] = useState(false);

//   const transport = useMemo(
//     () =>
//       new DefaultChatTransport({
//         api: "/api/chat",
//         body: (options: any) => {
//           const allMessages = options?.messages ?? [];
//           const trimmedMessages =
//             allMessages.length > MAX_MESSAGES
//               ? allMessages.slice(-MAX_MESSAGES)
//               : allMessages;

//           return {
//             messages: trimmedMessages,
//             deepThink,
//             selectedSystemPrompt: selectedSystemPrompt?.system_prompt_content,
//             llm_apiKey: selectedModel?.llm_apiKey,
//             llm_baseUrl: selectedModel?.llm_baseUrl,
//             llm_model: selectedModel?.llm_model,
//             llm_enable_search: enableSearch,
//             llm_enable_rag: enableRAG,
//             llm_enable_mic: enableMic,
//             mcpServers: selected.map((s) => ({
//               id: s.id,
//               name: s.name,
//               connection_type: s.connection_type,
//               connection_api: s.connection_api,
//               auth_type: s.auth_type,
//               auth_config: s.auth_config,
//               tools: s.tools,
//             })),
//             skills: selectedSkills.map((s) => ({
//               id: s.id,
//               name: s.name,
//               description: s.description,
//               input_schema: s.input_schema,
//               output_schema: s.output_schema,
//               handler_type: s.handler_type,
//               endpoint: s.endpoint,
//               handler_ref: s.handler_ref,
//               auth_type: s.auth_type,
//             })),
//           };
//         },
//       }),
//     [
//       deepThink,
//       selectedModel,
//       selectedSystemPrompt,
//       selected,
//       selectedSkills,
//       enableSearch,
//       enableRAG,
//       enableMic,
//     ],
//   );

//   const runtime = useChatRuntime({
//     transport,
//     onData: (dataPart) => {
//       if (dataPart.type === "data-log") {
//         const data = dataPart.data as {
//           level: string;
//           text: string;
//           color?: string;
//           time: string;
//         };
//         logWithColor(
//           (data.level?.toLowerCase() ?? "log") as LogLevel,
//           data.text,
//           data.color,
//         );
//       }
//     },
//   });

//   return (
//     <AssistantRuntimeProvider runtime={runtime}>
//       <ChatInner
//         deepThink={deepThink}
//         setDeepThink={setDeepThink}
//         systemPrompts={systemPrompts}
//         setSystemPrompts={setSystemPrompts}
//         selectedSystemPrompt={selectedSystemPrompt}
//         setSelectedSystemPrompt={setSelectedSystemPrompt}
//         models={models}
//         setModels={setModels}
//         selectedModel={selectedModel}
//         setSelectedModel={setSelectedModel}
//         enableSearch={enableSearch}
//         setEnableSearch={setEnableSearch}
//         enableRAG={enableRAG}
//         setEnableRAG={setEnableRAG}
//         enableMic={enableMic}
//         setEnableMic={setEnableMic}
//       />
//     </AssistantRuntimeProvider>
//   );
// }

// // ============================================================
// // Inner component
// // ============================================================
// type ChatInnerProps = {
//   deepThink: boolean;
//   setDeepThink: (v: boolean) => void;
//   systemPrompts: SystemPrompt[];
//   setSystemPrompts: (v: SystemPrompt[]) => void;
//   selectedSystemPrompt: SystemPrompt | null;
//   setSelectedSystemPrompt: (v: SystemPrompt | null) => void;
//   models: LLMModel[];
//   setModels: (v: LLMModel[]) => void;
//   selectedModel: LLMModel | null;
//   setSelectedModel: (v: LLMModel | null) => void;
//   enableSearch: boolean;
//   setEnableSearch: (v: boolean) => void;
//   enableRAG: boolean;
//   setEnableRAG: (v: boolean) => void;
//   enableMic: boolean;
//   setEnableMic: (v: boolean) => void;
// };

// function ChatInner({
//   deepThink,
//   setDeepThink,
//   systemPrompts,
//   setSystemPrompts,
//   selectedSystemPrompt,
//   setSelectedSystemPrompt,
//   models,
//   setModels,
//   selectedModel,
//   setSelectedModel,
//   enableSearch,
//   setEnableSearch,
//   enableRAG,
//   setEnableRAG,
//   enableMic,
//   setEnableMic,
// }: ChatInnerProps) {
//   const { triggerRefresh, restoreId, clearRestore } = useConversation();
//   const [saving, setSaving] = useState(false);

//   // 👇 当前会话 ID：有它时保存是更新，没它时是新建
//   const [conversationId, setConversationId] = useState<number | null>(null);

//   const [toast, setToast] = useState<{ message: string; visible: boolean }>({
//     message: "",
//     visible: false,
//   });

//   const showToast = (message: string) => {
//     setToast({ message, visible: true });
//     setTimeout(() => {
//       setToast((prev) => ({ ...prev, visible: false }));
//     }, 3000);
//   };

//   const messages = useAuiState((s) => s.thread.messages);
//   const aui = useAui(); // 👈 用于清空 / 注入消息

//   // 加载 system prompts
//   useEffect(() => {
//     fetch("/api/system_prompts")
//       .then((r) => r.json())
//       .then((data) => {
//         const list: SystemPrompt[] = data.system_prompts ?? [];
//         setSystemPrompts(list);
//         setSelectedSystemPrompt(
//           list.find((sp) => sp.is_default) ?? list[0] ?? null,
//         );
//       })
//       .catch((err) => log("Failed to fetch system prompts", err));
//   }, [setSystemPrompts, setSelectedSystemPrompt]);

//   // 加载 LLM models
//   useEffect(() => {
//     fetch("/api/llm")
//       .then((r) => r.json())
//       .then((data) => {
//         const list: LLMModel[] = data.models ?? [];
//         setModels(list);
//         setSelectedModel(list.find((m) => m.is_default) ?? list[0] ?? null);
//       })
//       .catch((err) => log("Failed to fetch models", err));
//   }, [setModels, setSelectedModel]);

//   // ============================================================
//   // 👇 恢复历史会话 - 使用正确的 assistant-ui API（最终版）
//   // ============================================================
//   useEffect(() => {
//     if (restoreId === null) return;

//     // restoreId === 0 → 新会话
//     if (restoreId === 0) {
//       try {
//         aui.thread().reset();
//         console.log("[restore] 已清空线程");
//       } catch (err) {
//         console.error("[restore] reset failed:", err);
//       }
//       setConversationId(null);
//       clearRestore();
//       return;
//     }

//     // restoreId > 0 → 恢复历史
//     (async () => {
//       try {
//         console.log(`\n${"=".repeat(60)}`);
//         console.log(`[restore] 🚀 开始恢复会话 ID: ${restoreId}`);
//         console.log(`${"=".repeat(60)}\n`);

//         const res = await fetch(`/api/conversation/${restoreId}`);
//         if (!res.ok) {
//           throw new Error(`HTTP ${res.status}`);
//         }

//         const data = await res.json();
//         console.log("[restore] 📦 API 原始返回:", data);
//         console.log("[restore] 📝 消息数量:", data.messages?.length || 0);

//         if (!Array.isArray(data?.messages) || data.messages.length === 0) {
//           throw new Error("无有效消息数据");
//         }

//         // ✅ 转换为 assistant-ui 需要的格式
//         const convertedMessages = data.messages
//           .map((m: any, idx: number) => {
//             console.log(`\n[restore] 🔍 处理消息 ${idx}:`);
//             console.log("  - raw data:", m);

//             // 提取文本内容
//             let textContent = "";

//             // 方式1：从 content 字段（优先）
//             if (typeof m.content === "string" && m.content.trim()) {
//               textContent = m.content.trim();
//               console.log(
//                 `  ✅ 从 content 字段获取 (${textContent.length} 字符)`,
//               );
//             }
//             // 方式2：从 parts 字段提取
//             else if (m.parts) {
//               let parts = m.parts;
//               if (typeof parts === "string") {
//                 try {
//                   parts = JSON.parse(parts);
//                 } catch (e) {
//                   parts = [];
//                 }
//               }

//               if (Array.isArray(parts)) {
//                 textContent = parts
//                   .filter((p: any) => p && p.type === "text")
//                   .map((p: any) => p.text || "")
//                   .join("");
//                 console.log(`  ✅ 从 parts 提取 (${textContent.length} 字符)`);
//               }
//             }

//             // 构建符合 assistant-ui 格式的消息
//             const message = {
//               id: m.id || `restored-${idx}`,
//               role: m.role,
//               createdAt: new Date(),
//               content: textContent
//                 ? [
//                     {
//                       type: "text",
//                       text: textContent,
//                     },
//                   ]
//                 : [],
//             };

//             console.log("  📤 转换结果:", {
//               id: message.id,
//               role: message.role,
//               contentLength: textContent.length,
//               preview:
//                 textContent.substring(0, 30) +
//                 (textContent.length > 30 ? "..." : ""),
//             });

//             return message;
//           })
//           .filter((m: any) => m.content && m.content.length > 0);

//         console.log(
//           `\n[restore] ✨ 转换完成，有效消息: ${convertedMessages.length}/${data.messages.length}`,
//         );

//         if (convertedMessages.length === 0) {
//           throw new Error("所有消息内容均为空");
//         }

//         // ✅✅✅ 关键：使用正确的 assistant-ui API 注入消息
//         console.log("\n[restore] ⚡ 准备注入消息到线程...");
//         console.log(
//           "[restore] 第一条消息示例:",
//           JSON.stringify(convertedMessages[0], null, 2),
//         );

//         // 方法1：尝试使用 reset（当前方式）
//         try {
//           // @ts-ignore - 绕过类型检查
//           aui.thread().reset(convertedMessages);
//           console.log("[reset] ✅ reset() 调用成功");
//         } catch (err) {
//           console.error("[reset] ❌ reset() 失败:", err);

//           // 方法2：如果 reset 失败，尝试逐条添加
//           console.log("[restore] 尝试备用方法...");
//           try {
//             aui.thread().reset(); // 先清空

//             for (const msg of convertedMessages) {
//               if (msg.role === "user") {
//                 // @ts-ignore
//                 aui.thread().sendMessage(msg.content[0]?.text || "");
//               } else if (msg.role === "assistant") {
//                 // @ts-ignore
//                 aui.thread().append(msg);
//               }
//             }
//             console.log("[restore] ✅ 逐条添加成功");
//           } catch (err2) {
//             console.error("[restore] ❌ 备用方法也失败:", err2);
//             throw err2;
//           }
//         }

//         // 设置会话ID并显示成功提示
//         setConversationId(restoreId);
//         showToast("✅ 会话已恢复");

//         // 延迟检查实际状态
//         setTimeout(() => {
//           try {
//             const state = aui.thread().getState();
//             console.log("\n[render check] 📊 线程状态:");
//             console.log("  - 消息总数:", state.messages?.length || 0);
//             console.log(
//               "  - 前3条消息:",
//               state.messages?.slice(0, 3)?.map((m: any) => ({
//                 role: m.role,
//                 contentLength: JSON.stringify(m.content)?.length || 0,
//               })),
//             );

//             if ((state.messages?.length || 0) === 0) {
//               console.warn("⚠️ 线程中仍然没有消息！可能需要刷新页面");
//             }
//           } catch (e) {
//             console.error("[render check] 获取状态失败:", e);
//           }
//         }, 200);

//         console.log(`\n${"=".repeat(60)}`);
//         console.log(`[restore] 🎉 恢复完成！会话 ID: ${restoreId}`);
//         console.log(`${"=".repeat(60)}\n`);
//       } catch (err) {
//         console.error("\n[restore] ❌❌❌ 恢复失败:", err);
//         showToast("❌ 恢复会话失败: " + (err as Error).message);
//       } finally {
//         clearRestore();
//       }
//     })();
//   }, [restoreId, clearRestore, aui]);

//   // 保存会话（有 ID 就更新，没有就新建）
//   const handleSave = async () => {
//     if (!messages?.length) {
//       showToast("❌ No messages to save");
//       return;
//     }
//     setSaving(true);
//     try {
//       const res = await fetch("/api/conversation/save", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           conversationId, // 👈 有就更新
//           model: selectedModel?.llm_model,
//           systemPrompt: selectedSystemPrompt?.system_prompt_name,
//           messages: messages.map((m) => ({
//             id: m.id,
//             role: m.role,
//             parts: m.parts,
//           })),
//         }),
//       });
//       const data = await res.json();
//       if (data.conversationId) {
//         setConversationId(data.conversationId); // 👈 记住 ID
//         triggerRefresh();
//         showToast("✅ Conversation saved");
//       } else {
//         showToast("❌ Save failed");
//       }
//     } catch (err) {
//       showToast("❌ Save failed");
//       log("Save failed", err);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // 新会话
//   const handleNewChat = () => {
//     aui.thread().reset();
//     setConversationId(null);
//     showToast("✨ New conversation");
//   };

//   return (
//     <div className="h-full w-full flex flex-col">
//       <div className="flex-1 min-h-0 overflow-hidden">
//         <Thread
//           composerToolbar={
//             <div className="flex items-center gap-2 flex-wrap">
//               {/* New Chat */}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleNewChat}
//                 className="h-8 text-xs text-cyan-300 bg-slate-900/60 border border-cyan-400/30 hover:bg-cyan-500/10"
//                 title="New Conversation"
//               >
//                 <Plus className="w-3.5 h-3.5 mr-1" />
//                 NEW
//               </Button>

//               {/* DeepThink */}
//               <Button
//                 variant="ghost"
//                 type="button"
//                 onClick={() => {
//                   const next = !deepThink;
//                   setDeepThink(next);
//                   log(`[DEEP_THINK] DeepThink shifted: ${next}`);
//                 }}
//                 className={`h-8 px-3 rounded-lg text-xs border transition-all ${
//                   deepThink
//                     ? "bg-cyan-500/30 text-cyan-400 border-cyan-600/80"
//                     : "bg-slate-900/60 text-slate-100 border-cyan-400/20"
//                 }`}
//               >
//                 <BrainCircuit className="w-4 h-4 mr-1.5" />
//                 {deepThink ? "DeepThink On" : "DeepThink Off"}
//               </Button>

//               {/* System Prompt */}
//               <DropdownMenu>
//                 <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300">
//                   <BookAIcon className="w-4 h-4 mr-1.5" />
//                   {selectedSystemPrompt?.system_prompt_name ?? "Prompt"}
//                   <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent
//                   align="start"
//                   className="w-56 bg-slate-900 border border-cyan-400/30 text-slate-100"
//                 >
//                   <DropdownMenuGroup>
//                     <DropdownMenuLabel className="text-xs text-cyan-400">
//                       SYSTEM PROMPT
//                     </DropdownMenuLabel>
//                   </DropdownMenuGroup>
//                   <DropdownMenuSeparator className="bg-cyan-400/20" />
//                   {systemPrompts.map((sp) => (
//                     <DropdownMenuItem
//                       key={sp.id}
//                       onClick={() => {
//                         setSelectedSystemPrompt(sp);
//                         log(
//                           `[SYSTEM] System Prompt: ${sp.system_prompt_content}`,
//                         );
//                       }}
//                       className={`cursor-pointer text-xs ${
//                         selectedSystemPrompt?.id === sp.id
//                           ? "bg-cyan-200/10 text-cyan-500"
//                           : ""
//                       }`}
//                     >
//                       📜 {sp.system_prompt_name}
//                     </DropdownMenuItem>
//                   ))}
//                 </DropdownMenuContent>
//               </DropdownMenu>

//               {/* Model */}
//               <DropdownMenu>
//                 <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300">
//                   <Cpu className="w-4 h-4 mr-1.5" />
//                   {selectedModel?.llm_model ?? "Model"}
//                   <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent
//                   align="start"
//                   className="w-56 bg-slate-900 border border-cyan-400/30 text-slate-100"
//                 >
//                   <DropdownMenuGroup>
//                     <DropdownMenuLabel className="text-xs text-cyan-400">
//                       SELECT MODEL
//                     </DropdownMenuLabel>
//                   </DropdownMenuGroup>
//                   <DropdownMenuSeparator className="bg-cyan-400/20" />
//                   {models.map((m) => (
//                     <DropdownMenuItem
//                       key={m.id}
//                       onClick={() => {
//                         setSelectedModel(m);
//                         log(`[MODEL] Model Shifted To: ${m.llm_model}`);
//                       }}
//                       className={`cursor-pointer text-xs ${
//                         selectedModel?.id === m.id
//                           ? "bg-cyan-500/10 text-cyan-300"
//                           : ""
//                       }`}
//                     >
//                       🚀 {m.llm_model}
//                     </DropdownMenuItem>
//                   ))}
//                 </DropdownMenuContent>
//               </DropdownMenu>

//               {/* Save */}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleSave}
//                 disabled={saving || !messages?.length}
//                 className="h-8 text-xs text-cyan-300 bg-slate-900/60 border border-cyan-400/30 disabled:opacity-40"
//               >
//                 <Save className="w-3.5 h-3.5 mr-1" />
//                 {saving ? "Saving..." : "SAVE"}
//               </Button>

//               {/* Mic */}
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => {
//                   const next = !enableMic;
//                   setEnableMic(next);
//                   log(`[MIC] Mic Set: ${next}`);
//                 }}
//                 title={enableMic ? "Microphone On" : "Microphone Off"}
//                 className={`h-8 w-8 transition-colors ${
//                   enableMic
//                     ? "text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10"
//                     : "text-orange-400 bg-cyan-500/20 border-orange-400/60"
//                 }`}
//               >
//                 <Mic className="w-4 h-4" />
//               </Button>

//               {/* Web Search */}
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => {
//                   const next = !enableSearch;
//                   setEnableSearch(next);
//                   log(`[SEARCH] Search Internet Set: ${next}`);
//                 }}
//                 title={enableSearch ? "Internet On" : "Internet Off"}
//                 className={`h-8 w-8 transition-colors ${
//                   enableSearch
//                     ? "text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10"
//                     : "text-red-400 bg-cyan-500/20 border-red-400/60"
//                 }`}
//               >
//                 <Globe className="w-4 h-4" />
//               </Button>

//               {/* RAG */}
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => {
//                   const next = !enableRAG;
//                   setEnableRAG(next);
//                   styledLog(
//                     `[RAG] RAG Set: ${next}`,
//                     next
//                       ? "color: #22d3ee; font-weight: bold"
//                       : "color: #9F9207",
//                     next ? "info" : "log",
//                   );
//                 }}
//                 title={enableRAG ? "RAG On" : "RAG Off"}
//                 className={`h-8 w-8 transition-colors ${
//                   enableRAG
//                     ? "text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10"
//                     : "text-red-400 bg-cyan-500/20 border-red-400/60"
//                 }`}
//               >
//                 <BookAIcon className="w-4 h-4" />
//               </Button>
//             </div>
//           }
//         />
//       </div>

//       {/* Toast */}
//       <div
//         className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm border backdrop-blur-md transition-all duration-300 ${
//           toast.visible
//             ? "opacity-100 translate-y-0"
//             : "opacity-0 -translate-y-2 pointer-events-none"
//         } ${
//           toast.message.startsWith("✅") || toast.message.includes("success")
//             ? "bg-cyan-500/20 text-cyan-100 border-cyan-400/50"
//             : "bg-red-500/20 text-red-100 border-red-400/50"
//         }`}
//       >
//         {toast.message}
//       </div>
//     </div>
//   );
// }
