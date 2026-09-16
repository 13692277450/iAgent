import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TokenCalendarContent } from "../pageTokenUsage";

export default async function TokenUsagePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <TokenCalendarContent />
    </div>
  );
}
