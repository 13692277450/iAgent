"use client";

import { useState } from "react";
import { Eye, EyeOff, Phone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#0a0a14] flex items-center justify-center overflow-hidden relative">
      {/* 背景光晕效果（模拟图中模糊背景） */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#12121f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {/* Logo 区域 */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              {/* 模拟 Sive 的 Logo */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Sive Logo"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M7 12L10 15L17 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              iAgent
            </span>
          </div>
          <p className="text-gray-400 text-sm">登录后开启访问LLM</p>
        </div>
        LLM
        {/* 表单区域 */}
        <div className="space-y-4">
          {/* 手机号输入框 */}
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
            <Input
              type="tel"
              placeholder="手机号"
              className="pl-11 h-12 bg-[#0a0a14] border border-blue-500/30 focus-visible:ring-blue-500 text-white rounded-xl placeholder:text-gray-500"
            />
          </div>

          {/* 人机验证（Aliyun Captcha） */}
          {/* <div className="h-12 bg-white rounded-xl flex items-center justify-between px-4 cursor-pointer">
            <span className="text-gray-700 text-sm font-medium">
              确认您不是机器人
            </span>
            <div className="flex flex-col items-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Aliyun Captcha"
                className="text-orange-500"
              >
                <rect
                  x="2"
                  y="4"
                  width="20"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="9"
                  cy="11"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M6 16L8.5 13.5C9 13 10 13 10.5 13.5L13 16"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-[10px] text-gray-500">阿里云</span>
            </div>
          </div> */}

          {/* 验证码输入 */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
              <Input
                type="text"
                placeholder="6位验证码"
                className="pl-11 h-12 bg-[#0a0a14] border border-blue-500/30 focus-visible:ring-blue-500 text-white rounded-xl placeholder:text-gray-500"
              />
            </div>
            <Button
              variant="outline"
              className="h-12 bg-[#12121f] border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-xl"
            >
              获取验证码
            </Button>
          </div>

          {/* 用户协议 */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
                agreed
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-500 bg-[#0a0a14]"
              }`}
            >
              {agreed && (
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-400">
              我已阅读并同意{" "}
              <span className="text-blue-400 hover:underline">
                《用户协议》
              </span>{" "}
              和{" "}
              <span className="text-blue-400 hover:underline">
                《隐私协议》
              </span>
            </span>
          </label>

          {/* 登录按钮 */}
          <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-semibold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.4)]">
            登录 / 注册
          </Button>

          {/* 分割线 */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-700/50" />
            <span className="text-xs text-gray-500">或使用以下方式登录</span>
            <div className="flex-1 h-px bg-gray-700/50" />
          </div>

          {/* GitHub 登录 */}
          <Button
            variant="outline"
            className="w-full h-12 bg-[#0a0a14] border border-gray-700/80 hover:border-gray-600 hover:bg-gray-800/50 text-white rounded-xl"
          >
            使用 GitHub 登录
          </Button>
        </div>
      </div>
    </div>
  );
}
