import { UIMatch, useNavigate, LoaderFunctionArgs } from "react-router-dom";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { NewChat } from "../../../../components/chat/new-chat.tsx";
import { Message } from "../../../../components/chat/message-composer.tsx";
import { enthusiastAdminSdk } from "../../../lib/sdk.ts";
import { Agent, AgentDetails } from "../../../../modules/enthusiast/api/types/agent.ts";
import { Conversation } from "../../../../modules/enthusiast/api/types/conversation.ts";
import { SingleColumnLayout } from "../../../../components/ui/single-column.tsx";
import { useActiveDataset } from "../../../hooks/use-active-dataset.ts";

export type OnPendingMessage = (message: Message, conversationId: number) => void;

const EnthusiastNewChatPage = () => {
  const navigate = useNavigate();
  const { datasetId, isLoading } = useActiveDataset();

  const onPendingMessage: OnPendingMessage = (message, conversationId) => {
    navigate(`/enthusiast/chat/${conversationId}`, {
      state: {
        pendingMessage: message,
      },
    });
  };

  if (isLoading || !datasetId) return null;

  return (
    <SingleColumnLayout>
      <NewChat datasetId={datasetId} onPendingMessage={onPendingMessage} />
    </SingleColumnLayout>
  );
};

export const config = defineRouteConfig({});

export default EnthusiastNewChatPage;

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (params.chatId) {
    const conversation = await enthusiastAdminSdk.client.fetch<Conversation>(
      `/enthusiast/conversations/${params.chatId}`
    );
    return conversation.agent;
  }
  const requestCopy = request.clone();
  const url = new URL(requestCopy.url);
  const searchParams = url.searchParams;
  const agentId = searchParams.get("agent");
  if (!agentId) {
    return null;
  }
  return await enthusiastAdminSdk.client.fetch<AgentDetails>(`/enthusiast/agents/${agentId}`);
}

export const handle = {
  breadcrumb: ({ data }: UIMatch<AgentDetails | Agent>) => data.name || "Agent",
};
