/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Phone, KeyRound, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      // 登录成功，跳转到 chat
      router.push("/chat");
    } catch (err) {
      console.error(err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a14] flex items-center justify-center overflow-hidden relative">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] bg-[#12121f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
          <p className="text-gray-400 text-sm">登录后开启访问 LLM</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* 用户名 */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
            <Input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="pl-11 h-12 bg-[#0a0a14] border border-blue-500/30 focus-visible:ring-blue-500 text-white rounded-xl placeholder:text-gray-500"
            />
          </div>

          {/* 密码 */}
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-11 pr-11 h-12 bg-[#0a0a14] border border-blue-500/30 focus-visible:ring-blue-500 text-white rounded-xl placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-semibold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.4)]"
          >
            {loading ? "登录中..." : "登录 / 注册"}
          </Button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-700/50" />
            <span className="text-xs text-gray-500">或使用以下方式登录</span>
            <div className="flex-1 h-px bg-gray-700/50" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-[#0a0a14] border border-gray-700/80 hover:border-gray-600 hover:bg-gray-800/50 text-white rounded-xl"
          >
            使用 GitHub 登录
          </Button>
        </form>
      </div>
    </div>
  );
}
