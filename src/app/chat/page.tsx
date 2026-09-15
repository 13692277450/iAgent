import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Layout from "./pageMainLayout";
import { McpProvider } from "@/components/mcp_provider";

export default async function ChatPage() {
  console.log("ChatPage rendering...");
  const session = await getSession();
  console.log("Session:", session);

  if (!session) {
    redirect("/login");
  }
  return (
    <McpProvider>
      <Layout />
      );
    </McpProvider>
  );
}
