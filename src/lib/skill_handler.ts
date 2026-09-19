// src/lib/skill-handlers.ts
// 🚨 每个函数名要和 skill.handler_ref 一致

// 计算器
export async function calculator(args: { expression: string }) {
  // ⚠️ 生产环境不要用 eval，这里仅演示
  // 建议用 mathjs 或自己写 parser
  const { evaluate } = await import("mathjs");
  return { result: evaluate(args.expression) };
}

// 渲染输出（内置 skill）
export async function render_output(args: {
  content: string;
  language?: string;
  filename?: string;
}) {
  return {
    ok: true,
    content: args.content,
    language: args.language ?? "text",
    filename: args.filename ?? "output.txt",
  };
}

// 发送邮件（示例，需接入真实邮件服务）
export async function send_email(args: {
  to: string;
  subject: string;
  body: string;
}) {
  // TODO: 接入 nodemailer / SendGrid 等
  console.log("[send_email]", args);
  return {
    success: true,
    message_id: `msg_${Date.now()}`,
  };
}