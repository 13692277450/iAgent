import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Layout from "./pageMainLayout";
import { McpProvider } from "@/components/mcp_provider";
import { SkillsProvider } from "@/components/assistant-ui/elements/skills-provider";
import { ConversationProvider } from "@/components/conversation-provider";
import { log } from "@/lib/logger";

export default async function ChatPage({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("ChatPage rendering...");
  log("ChatPage rendering...");

  const session = await getSession();
  console.log("Session:", session);

  if (!session) {
    redirect("/login");
  }
  return (
    // <McpProvider>
    //   <Layout />
    // </McpProvider>

    <McpProvider>
      <SkillsProvider>
        <ConversationProvider>
          <Layout />
        </ConversationProvider>
      </SkillsProvider>
    </McpProvider>
  );
}
