"use client"; // Marks this file as a Client Component in Next.js App Router

// React hooks for side effects, state, and memoization
import { useEffect, useState, useMemo } from "react";
// Custom providers for MCP (Model Context Protocol), Skills, and Conversation state
import { useMcp } from "@/components/mcp_provider";
import { useSkills } from "@/components/assistant-ui/elements/skills-provider";
import { useConversation } from "@/components/conversation-provider";
// Assistant UI runtime provider and state hook
import { AssistantRuntimeProvider, useAuiState } from "@assistant-ui/react";
// Hook that wires the AI SDK transport into a chat runtime
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
// Prebuilt Thread component that renders the chat UI
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
// Transport layer that posts chat requests to an API route
import { DefaultChatTransport } from "ai";
// Simple logger utility
import { log } from "@/lib/logger";

// Icon set used in the composer toolbar
import {
  BrainCircuit,
  Mic,
  Globe,
  Save,
  Cpu,
  BookAIcon,
  ChevronDown,
} from "lucide-react";
// Dropdown menu primitives (shadcn/ui style)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Button primitive
import { Button } from "@/components/ui/button";

// Shape of an LLM model record coming from the backend
type LLMModel = {
  id: number;
  llm_name: string;
  llm_apiKey: string;
  llm_baseUrl: string;
  llm_model: string;
  is_default: boolean;
};

// Shape of a system prompt record coming from the backend
type SystemPrompt = {
  id: number;
  system_prompt_name: string;
  system_prompt_content: string;
  system_prompt_format?: string; // Optional format hint (e.g., markdown, plain)
  is_default: boolean;
};

// ============================================================
// Outer component: only responsible for creating the runtime
// ============================================================
export default function ChatPage() {
  // Currently selected MCP servers (from MCP provider)
  const { selected } = useMcp();
  // Currently selected skills (from Skills provider)
  const { selected: selectedSkills } = useSkills();

  // Toggle for "deep think" reasoning mode
  const [deepThink, setDeepThink] = useState(false);
  // List of available system prompts
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  // Currently chosen system prompt
  const [selectedSystemPrompt, setSelectedSystemPrompt] =
    useState<SystemPrompt | null>(null);
  // List of available LLM models
  const [models, setModels] = useState<LLMModel[]>([]);
  // Currently chosen LLM model
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const MAX_MESSAGES = 10;
  const [enableSearch, setEnableSearch] = useState(false);

  // Build the transport once per dependency change; the body() callback
  // is re-evaluated on each request so the latest state is always sent.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat", // Backend endpoint that handles the chat request
        // 👇 body receives the current request options, including the full
        //    message list, so we can trim it before it's sent.
        body: (options: any) => {
          console.log("[transport body options]", options);

          // Full message history assembled by DefaultChatTransport
          const allMessages = options?.messages ?? [];

          // Keep only the most recent MAX_MESSAGES messages to save tokens.
          // If the total is within the limit, keep everything.
          const trimmedMessages =
            allMessages.length > MAX_MESSAGES
              ? allMessages.slice(-MAX_MESSAGES)
              : allMessages;

          return {
            // 👇 Explicitly override `messages` with the trimmed list.
            //    Without this, DefaultChatTransport would send the full history.
            messages: trimmedMessages,

            deepThink, // Whether deep-think mode is enabled
            selectedSystemPrompt: selectedSystemPrompt?.system_prompt_content, // Prompt content to inject
            llm_apiKey: selectedModel?.llm_apiKey, // API key for the model
            llm_baseUrl: selectedModel?.llm_baseUrl, // Base URL for the model
            llm_model: selectedModel?.llm_model, // Model identifier
            llm_enable_search: enableSearch,
            // Serialize only the fields the backend needs for MCP servers
            mcpServers: selected.map((s) => ({
              id: s.id,
              name: s.name,
              connection_type: s.connection_type,
              connection_api: s.connection_api,
              auth_type: s.auth_type,
              auth_config: s.auth_config,
              tools: s.tools,
            })),
            // Serialize selected skills for the backend
            skills: selectedSkills.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              input_schema: s.input_schema,
              output_schema: s.output_schema,
              handler_type: s.handler_type,
              endpoint: s.endpoint,
              handler_ref: s.handler_ref,
              auth_type: s.auth_type,
            })),
          };
        },
      }),
    // Recreate the transport whenever any of these dependencies change
    [
      deepThink,
      selectedModel,
      selectedSystemPrompt,
      selected,
      selectedSkills,
      enableSearch,
    ],
  );

  // Create the chat runtime from the transport
  const runtime = useChatRuntime({
    transport,

    // Handle streaming data parts sent by the server
    onData: (dataPart) => {
      // "data-log" parts carry log messages to be written to the local logger
      if (dataPart.type === "data-log") {
        const data = dataPart.data as {
          level: string;
          text: string;
          time: string;
        };

        log(data.text);
      }
    },
  });

  // Provide the runtime to the entire subtree, then render the inner UI
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
      />
    </AssistantRuntimeProvider>
  );
}

// ============================================================
// Inner component: renders the UI and consumes the runtime
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
}: ChatInnerProps) {
  // Used to notify the conversation list that a new conversation was saved
  const { triggerRefresh } = useConversation();
  // Whether a save request is in flight
  const [saving, setSaving] = useState(false);

  // ✅ Toast state for showing transient success/error messages
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  // Show a toast message and auto-hide it after 3 seconds
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Read the current thread's messages from the assistant-ui state
  const messages = useAuiState((s) => s.thread.messages);

  // Load system prompts on mount and select the default (or first) one
  useEffect(() => {
    fetch("/api/system_prompts")
      .then((r) => r.json())
      .then((data) => {
        const list: SystemPrompt[] = data.system_prompts ?? [];
        setSystemPrompts(list);
        setSelectedSystemPrompt(
          list.find((sp) => sp.is_default) ?? list[0] ?? null,
        );
      })
      .catch((err) => log("Failed to fetch system prompts", err));
  }, [setSystemPrompts, setSelectedSystemPrompt]);

  // Load LLM models on mount and select the default (or first) one
  useEffect(() => {
    fetch("/api/llm")
      .then((r) => r.json())
      .then((data) => {
        const list: LLMModel[] = data.models ?? [];
        setModels(list);
        setSelectedModel(list.find((m) => m.is_default) ?? list[0] ?? null);
      })
      .catch((err) => log("Failed to fetch models", err));
  }, [setModels, setSelectedModel]);

  // Persist the current conversation to the backend
  const handleSave = async () => {
    if (!messages?.length) {
      log("No messages to save");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/conversation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel?.llm_model,
          systemPrompt: selectedSystemPrompt?.system_prompt_name,
          // Only send the fields the backend needs for each message
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
          })),
        }),
      });
      const data = await res.json();
      // Refresh the conversation list if the backend returned an ID
      if (data.conversationId) triggerRefresh();
      showToast("Conversation saved successfully");
    } catch (err) {
      showToast("Save failed");
      log("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Thread
          // Custom toolbar rendered below the composer
          composerToolbar={
            <div className="flex items-center gap-2 flex-wrap">
              {/* DeepThink toggle button */}
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setDeepThink(!deepThink);
                  log(`DeepThink shifted: ${!deepThink}`);
                }}
                className={`h-8 px-3 rounded-lg text-xs border transition-all ${
                  deepThink
                    ? "bg-cyan-500/30 text-cyan-400 border-cyan-600/80"
                    : "bg-slate-900/60 text-slate-100 border-cyan-400/20"
                }`}
              >
                <BrainCircuit className="w-4 h-4 mr-1.5" />
                {deepThink ? "DeepThink On" : "DeepThink Off"}
              </Button>

              {/* System prompt selector dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300">
                  <BookAIcon className="w-4 h-4 mr-1.5" />
                  {selectedSystemPrompt?.system_prompt_name ?? "Prompt"}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-slate-900 border border-cyan-400/30 text-slate-100"
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
                        log(`System Prompt:  ${sp.system_prompt_content}`);
                      }}
                      className={`cursor-pointer text-xs ${
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

              {/* LLM model selector dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center shrink-0 h-8 px-3 rounded-lg text-xs bg-slate-900/60 border border-cyan-400/30 text-cyan-300">
                  <Cpu className="w-4 h-4 mr-1.5" />
                  {selectedModel?.llm_model ?? "Model"}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-slate-900 border border-cyan-400/30 text-slate-100"
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
                        log(`Model Shifted To:  ${m.llm_model}`);
                      }}
                      className={`cursor-pointer text-xs ${
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

              {/* Save conversation button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="h-8 text-xs text-cyan-300 bg-slate-900/60 border border-cyan-400/30"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                {saving ? "Saving..." : "SAVE"}
              </Button>
              {/* Placeholder microphone button (not wired up yet) */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-cyan-600"
              >
                <Mic className="w-4 h-4" />
              </Button>
              {/* Placeholder globe/web button (not wired up yet) */}
              <Button
                variant="ghost"
                size="icon"
                // className="h-8 w-8 text-cyan-600"
                onClick={() => {
                  setEnableSearch(!enableSearch);
                  log(`Search Enabled:  ${enableSearch}`);
                }}
                title={enableSearch ? "Internet On" : "Internet Off"}
                className={`h-8 w-8 transition-colors shimmer-color-amber-500 ${
                  enableSearch
                    ? "text-red-400 bg-cyan-500/20 border border-red-400/60 ]"
                    : "text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10"
                }`}
              >
                <Globe className="w-4 h-4" />
              </Button>
            </div>
          }
        />
      </div>

      {/* Toast notification */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm border backdrop-blur-md transition-all duration-300 ${
          toast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        } ${
          // Cyan styling for success messages, red for everything else
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
