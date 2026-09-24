import { tool } from "ai";
import { z } from "zod";

/**
 * render_output：Put required content in a structured text box
 */
export const renderOutputTool = tool({
  description:
    "把用户需要复制或下载的最终内容放进这里，会显示成一个带复制/下载按钮的文本框",
  inputSchema: z.object({
    content: z
      .string()
      .describe("用户需要复制或下载的最终内容，例如代码、文章、清单等"),
    language: z
      .string()
      .optional()
      .describe("可选，内容语言或类型，例如 code / markdown / text"),
    filename: z
      .string()
      .optional()
      .describe("可选，建议的下载文件名，例如 output.py"),
  }),
  execute: async (input) => {
    return input;
  },
});

/**
 * weather：Get the weather in a location (fahrenheit)
 */
export const weatherTool = tool({
  description: "Get the weather in a location (fahrenheit)",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => {
    const temperature = Math.round(Math.random() * (90 - 32) + 32);
    return { location, temperature };
  },
});

/**
 * ALL_TOOLS：All available tools
 */
export const ALL_TOOLS = {
  // render_output: renderOutputTool,
  // weather: weatherTool,

};