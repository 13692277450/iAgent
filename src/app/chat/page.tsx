import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Layout from "./pageMainLayout";

export default async function ChatPage() {
  console.log("ChatPage rendering...");
  const session = await getSession();
  console.log("Session:", session);

  if (!session) {
    redirect("/login");
  }
  return <Layout />;
}
