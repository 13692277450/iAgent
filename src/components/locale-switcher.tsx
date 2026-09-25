"use client";

import { Languages } from "lucide-react";
import { LOCALES } from "@/i18n/locales";
import { useI18n } from "./i18n-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALES.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="...">
        <Languages className="size-3.5 text-cyan-600 dark:text-cyan-400" />
        <span className="hidden sm:inline">{current?.short ?? "EN"}</span>
        <span className="sm:hidden">{current?.flag}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* 👇 用 DropdownMenuGroup 包住 Label + Items */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("lang.language")}</DropdownMenuLabel>
          {LOCALES.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={`cursor-pointer gap-2 text-xs ${
                locale === l.code
                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  : ""
              }`}
            >
              <span aria-hidden>{l.flag}</span>
              <span className="flex-1">{l.label}</span>
              {locale === l.code && (
                <span className="text-[10px] font-semibold text-cyan-500">
                  ●
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
