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
  const MAX_MESSAGES = 0 as number;
  const [enableSearch, setEnableSearch] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: (options: any) => {
          // 防御性检查：确保 messages 是数组
          // const allMessages = options?.messages ?? [];
          // let trimmedMessages =
          //   Array.isArray(allMessages) && allMessages.length > MAX_MESSAGES;

          // MAX_MESSAGES === 0
          //   ? []
          //   : allMessages.length > MAX_MESSAGES
          //     ? allMessages.slice(-MAX_MESSAGES)
          //     : allMessages;
          const allMessages = options?.messages ?? [];

          const trimmedMessages =
            MAX_MESSAGES === 0
              ? []
              : allMessages.length > MAX_MESSAGES
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
