"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AssistantRuntimeProvider,
  AssistantModalPrimitive,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { DefaultChatTransport } from "ai";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { MessageCircle, X, RefreshCw } from "lucide-react";

type LLMModel = {
  id: number;
  llm_name: string;
  llm_apiKey: string;
  llm_baseUrl: string;
  llm_model: string;
  is_default: boolean;
  deepThink: boolean;
  llm_system_prompt: string;
};

function newSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SupportChatBubble() {
  const [sessionId, setSessionId] = useState(() => newSessionId());
  const [runtimeKey, setRuntimeKey] = useState(0);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);

  // 👇 拉默认模型（和主 chatpage 一样）
  useEffect(() => {
    fetch("/api/llm")
      .then((r) => r.json())
      .then((data) => {
        const list: LLMModel[] = data.models ?? [];
        setSelectedModel(list.find((m) => m.is_default) ?? list[0] ?? null);
      })
      .catch((err) => console.error("[SupportChat] fetch models failed:", err));
  }, []);

  // 👇 transport 带 sessionId + 模型配置
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          llm_enable_rag: true, // 客服场景总是开 RAG
          sessionId, // 传给后端写日志
          llm_apiKey: selectedModel?.llm_apiKey,
          llm_baseUrl: selectedModel?.llm_baseUrl,
          llm_model: selectedModel?.llm_model,
          deepThink: false,
          llm_system_prompt:
            selectedModel?.llm_system_prompt ??
            "你是一个专业的客服，你需要根据用户的问题，要用亲切和蔼的语言提供专业的回答。如果用户的问题不能回答，要说明非常抱歉，现在不能回答，请客户留下联系方式，后续会让人工客服联系您为您服务。",
        },
      }),
    [sessionId, selectedModel],
  );

  const runtime = useChatRuntime({
    transport,
    onData: (dataPart) => {
      if (dataPart.type === "data-log") {
        const data = dataPart.data as { level: string; text: string };
        console.log(`[SupportChat] ${data.text}`);
      }
    },
  });

  // 新对话：重置 sessionId + 重建 runtime
  const handleNewChat = () => {
    setSessionId(newSessionId());
    setRuntimeKey((k) => k + 1);
  };

  return (
    <AssistantRuntimeProvider key={runtimeKey} runtime={runtime}>
      <AssistantModalPrimitive.Root
        unstable_openOnRunStart={false}
        modal={false}
      >
        {/* 悬浮球 */}
        <AssistantModalPrimitive.Anchor className="fixed bottom-6 right-6 z-50">
          <AssistantModalPrimitive.Trigger asChild>
            <button
              type="button"
              title="Open AI Service"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-transform hover:scale-105 active:scale-95"
              aria-label="Open AI Service"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </AssistantModalPrimitive.Trigger>
        </AssistantModalPrimitive.Anchor>

        {/* 聊天面板 */}
        <AssistantModalPrimitive.Content
          side="top"
          align="end"
          sideOffset={16}
          className="flex h-[600px] w-[420px] flex-col overflow-hidden rounded-2xl border border-cyan-400/30 bg-slate-950 shadow-2xl"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-cyan-400/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-slate-100">
                AI Service
              </span>
              {selectedModel && (
                <span className="text-xs text-slate-500">
                  {selectedModel.llm_model}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                title="New Coversation"
                aria-label="New Coversation"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <AssistantModalPrimitive.Trigger asChild>
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </AssistantModalPrimitive.Trigger>
            </div>
          </div>

          {/* 消息区 */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Thread />
          </div>
        </AssistantModalPrimitive.Content>
      </AssistantModalPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}
