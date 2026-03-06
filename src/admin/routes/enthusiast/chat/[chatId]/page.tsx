import { UIMatch, LoaderFunctionArgs } from "react-router-dom";
import { ChatSession } from "../../../../../components/chat/chat-session.tsx";

import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Agent, AgentDetails } from "../../../../../modules/enthusiast/api/types/agent.ts";
import { Conversation } from "../../../../../modules/enthusiast/api/types/conversation.ts";
import { SingleColumnLayout } from "../../../../../components/ui/single-column.tsx";
import { useActiveDataset } from "../../../../hooks/use-active-dataset.ts";
import { enthusiastAdminSdk } from "../../../../lib/sdk.ts";

const EnthusiastChatPage = () => {
  const { datasetId, isLoading } = useActiveDataset();

  if (isLoading || !datasetId) return null;

  return (
    <SingleColumnLayout>
      <ChatSession datasetId={datasetId} />
    </SingleColumnLayout>
  );
};

export const config = defineRouteConfig({});

export default EnthusiastChatPage;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { chatId } = params;

  if (!chatId || chatId === "new") {
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agent");
    if (!agentId) return null;
    return await enthusiastAdminSdk.client.fetch<AgentDetails>(`/enthusiast/agents/${agentId}`);
  }

  const conversation = await enthusiastAdminSdk.client.fetch<Conversation>(
    `/enthusiast/conversations/${chatId}`
  );
  return conversation.agent;
}

export const handle = {
  breadcrumb: ({ data }: UIMatch<AgentDetails | Agent>) => data?.name || "Agent",
};
