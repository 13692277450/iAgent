"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useMcp } from "@/components/mcp_provider";
import { useSkills } from "@/components/skills-provider";
import { useConversation } from "@/components/conversation-provider";
import { AssistantRuntimeProvider, useAuiState } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { DefaultChatTransport } from "ai";
import { log } from "@/lib/logger";

import {
  BrainCircuit,
  Paperclip,
  Mic,
  Globe,
  Save,
  Cpu,
  BookAIcon,
  ChevronDown,
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
// 外层：只负责创建 runtime，不调用任何 assistant-ui 的 hook
// ============================================================
export default function ChatPage() {
  const { selected } = useMcp();
  const { selected: selectedSkills } = useSkills();

  const [deepThink, setDeepThink] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedSystemPrompt, setSelectedSystemPrompt] =
    useState<SystemPrompt | null>(null);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
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
        }),
      }),
    [deepThink, selectedModel, selectedSystemPrompt, selected, selectedSkills],
  );

  const runtime = useChatRuntime({
    transport,
    onData: (dataPart) => {
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
      />
    </AssistantRuntimeProvider>
  );
}

// ============================================================
// 内层：在 Provider 内部，可以安全使用 useAuiState
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
}: ChatInnerProps) {
  const { triggerRefresh } = useConversation();
  const [saving, setSaving] = useState(false);

  // ✅ 现在在 Provider 内部，useAuiState 可以正常工作
  const messages = useAuiState((s) => s.thread.messages);

  // 加载 System Prompts
  useEffect(() => {
    fetch("/api/system_prompts")
      .then((r) => r.json())
      .then((data) => {
        const list: SystemPrompt[] = data.system_prompts ?? [];
        setSystemPrompts(list);
        setSelectedSystemPrompt(
          list.find((sp) => sp.is_default) ?? list[0] ?? null,
        );
        log(data.text);
      })
      .catch((err) => log("Failed to fetch system prompts", err));
  }, [setSystemPrompts, setSelectedSystemPrompt]);

  // 加载模型
  useEffect(() => {
    fetch("/api/llm")
      .then((r) => r.json())
      .then((data) => {
        const list: LLMModel[] = data.models ?? [];
        setModels(list);
        setSelectedModel(list.find((m) => m.is_default) ?? list[0] ?? null);
        // log(
        //   "[LLM NAME]: ",
        //   list.map((m) => m.llm_model),
        // );
      })
      .catch((err) => log("Failed to fetch models", err));
  }, [setModels, setSelectedModel]);

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
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
          })),
        }),
      });
      const data = await res.json();
      if (data.conversationId) triggerRefresh();
    } catch (err) {
      log("Save failed", err);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Thread
          composerToolbar={
            <div className="flex items-center gap-2 flex-wrap">
              {/* DeepThink */}
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

              {/* System Prompt */}
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

              {/* Model */}
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

              {/* <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-cyan-600"
              >
                <Paperclip className="w-4 h-4" />
              </Button> */}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-cyan-600"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-cyan-600"
              >
                <Globe className="w-4 h-4" />
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
