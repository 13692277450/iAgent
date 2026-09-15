// src/components/user-provider.tsx
"use client";
import { createContext, useContext } from "react";

const UserContext = createContext<string | null>(null);

export function UserProvider({
  username,
  children,
}: {
  username: string | null;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={username}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
