// cli.ts
import React from "react";
import { render } from "ink";
import Home from "./src/app/page";

const agentConfig = {
  apiKey: process.env.ALI_API_KEY ?? "",
  baseURL: process.env.ALI_OPENAI_API_BASE_URL ?? "",
  model: process.env.ALI_MODEL ?? "qwen-plus",
  tools: {},
  systemPrompt: "你是一个助手",
};

render(React.createElement(Home, { agentConfig }));
