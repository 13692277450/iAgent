import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PageTokenCalendar from "../pageTokenCalendar";

export default async function TokenCalendarPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <PageTokenCalendar />
    </div>
  );
}