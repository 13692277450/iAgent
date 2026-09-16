// src/components/skills-provider.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Skill = {
  id: number;
  name: string;
  display_name: string | null;
  description: string;
  handler_type: string;
  auth_type: string | null;
  enabled: boolean;
  is_default: boolean;
  input_schema: unknown;
  output_schema: unknown;
  endpoint: string | null;
  handler_ref: string | null;
  metadata: unknown;
};

type SkillsContextValue = {
  skills: Skill[];
  selected: Skill[];
  toggle: (skill: Skill) => void;
  isSelected: (id: number) => boolean;
  cleanAll: () => void;
  loading: boolean;
};

const SkillsContext = createContext<SkillsContextValue | null>(null);
const SkillsContextProvider = SkillsContext.Provider;

export function SkillsProvider({ children }: { children: React.ReactNode }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch("/api/skills", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        const list: Skill[] = d.skills ?? [];
        setSkills(list);
        // 默认选中的 skill 自动勾上
        const defaults = list.filter((s) => s.is_default);
        if (defaults.length > 0) {
          setSelected(defaults);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch skills", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // 🚨 按 id 去重，避免重复选中
  const toggle = useCallback((skill: Skill) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.id === skill.id);
      if (exists) return prev.filter((s) => s.id !== skill.id);
      return [...prev, skill];
    });
  }, []);

  const isSelected = useCallback(
    (id: number) => selected.some((s) => s.id === id),
    [selected],
  );

  const cleanAll = useCallback(() => setSelected([]), []);

  return (
    <SkillsContextProvider
      value={{ skills, selected, toggle, isSelected, cleanAll, loading }}
    >
      {children}
    </SkillsContextProvider>
  );
}

export function useSkills() {
  const ctx = useContext(SkillsContext);
  if (!ctx) throw new Error("useSkills must be used within <SkillsProvider>");
  return ctx;
}
