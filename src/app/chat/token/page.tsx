import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TokenCalendarContent } from "../pageTokenUsage";

export default async function TokenUsagePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="tech-bg min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <TokenCalendarContent />
      </div>
    </div>
  );
}