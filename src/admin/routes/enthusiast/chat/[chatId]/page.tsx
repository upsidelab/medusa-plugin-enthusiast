import { UIMatch, useLocation } from "react-router-dom";
import { ChatSession } from "../../../../../components/chat/chat-session.tsx";

import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AgentDetails } from "../../../../../modules/enthusiast/api/types/agent.ts";
import { SingleColumnLayout } from "../../../../../components/ui/single-column.tsx";
import { Message } from "../../../../../components/chat/message-composer";
import { useActiveDataset } from "../../../../hooks/use-active-dataset.ts";

const EnthusiastChatPage = () => {
  const { state } = useLocation() as { state?: { pendingMessage?: Message } };
  const { datasetId, isLoading } = useActiveDataset();

  if (isLoading || !datasetId) return null;

  return (
    <SingleColumnLayout>
      <ChatSession datasetId={datasetId} pendingMessage={state?.pendingMessage} />
    </SingleColumnLayout>
  );
};

export const config = defineRouteConfig({});

export default EnthusiastChatPage;

export const handle = {
  breadcrumb: ({ data }: UIMatch<AgentDetails>) => data.name,
};
