// src/components/mcp-server-dialog.tsx
"use client";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useMcp } from "@/components/mcp_provider";

const STATUS_COLOR: Record<string, string> = {
  connected: "text-green-400",
  error: "text-red-400",
  unknown: "text-slate-400",
  disabled: "text-slate-500",
};

export function McpServerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { servers, selected, toggle, isSelected } = useMcp();
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return servers;
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        (s.description ?? "").toLowerCase().includes(kw),
    );
  }, [servers, keyword]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-h-[200vh] !max-w-[1200px] !h-[800px] flex flex-col
          bg-slate-950
          border border-cyan-400/40
          text-slate-200
          shadow-[0_0_40px_rgba(34,211,238,0.25),inset_0_0_20px_rgba(34,211,238,0.05)]
          backdrop-blur-md
          rounded-xl
          [&>button]:text-slate-400 [&>button]:hover:text-cyan-300
        "
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-mono text-cyan-400 tracking-wide">
            ALL MCP SERVERS
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Select the MCP Server to connect.
          </DialogDescription>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search MCP servers..."
            className="
              pl-9
              bg-slate-900/70
              border-cyan-400/30
              text-slate-100
              placeholder:text-slate-500
              focus-visible:border-cyan-300/80
              focus-visible:ring-cyan-400/30
            "
          />
        </div>

        {/* 可滚动表格 */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-cyan-400/20 rounded-md bg-slate-900/40 custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/90 sticky top-0 backdrop-blur-sm">
              <tr className="text-cyan-400">
                <th className="w-10 px-2 py-2"></th>
                <th className="text-left px-2 py-2 font-mono text-xs">NAME</th>
                <th className="text-left px-2 py-2 font-mono text-xs">
                  STATUS
                </th>
                <th className="text-left px-2 py-2 font-mono text-xs">TYPE</th>
                <th className="text-left px-2 py-2 font-mono text-xs">
                  DESCRIPTION
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-slate-500 py-6 text-sm"
                  >
                    No MCP server found
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const checked = isSelected(s.id);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => toggle(s)}
                      className={`
                        border-t border-cyan-400/10 cursor-pointer transition-colors
                        hover:bg-cyan-500/10
                        ${checked ? "bg-cyan-500/15" : ""}
                      `}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(s)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-2 text-slate-100 font-medium">
                        {s.name}
                      </td>
                      <td
                        className={`px-2 py-2 text-xs ${STATUS_COLOR[s.status] ?? "text-slate-400"}`}
                      >
                        {s.status}
                      </td>
                      <td className="px-2 py-2 text-xs text-cyan-300/80">
                        {s.connection_type}
                      </td>
                      <td className="px-2 py-2 text-xs text-slate-400 truncate max-w-[200px]">
                        {s.description ?? "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 底部：Selected MCP Servers */}
        <div className="pt-3 border-t border-cyan-400/20">
          <div className="text-xs font-mono text-cyan-400 mb-2 tracking-wide">
            SELECTED MCP SERVERS:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
            {selected.length === 0 ? (
              <span className="text-xs text-slate-500 italic">None</span>
            ) : (
              selected.map((s) => (
                <span
                  key={s.id}
                  className="
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                    bg-cyan-500/15 text-cyan-300 text-xs
                    border border-cyan-400/30
                    shadow-[0_0_8px_rgba(34,211,238,0.15)]
                  "
                >
                  {s.name}
                </span>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
