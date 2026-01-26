import { UIMatch, useLocation } from "react-router-dom";
import { ChatSession } from "../../../../../../../components/chat/chat-session.tsx";

import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AgentDetails } from "../../../../../../../modules/enthusiast/api/types/agent.ts";
import { SingleColumnLayout } from "../../../../../../../components/ui/single-column.tsx";
import { Message } from "../../../../../../../components/chat/message-composer";

const EnthusiastChatPage = () => {
  const { state } = useLocation() as { state?: { pendingMessage?: Message } };
  return (
    <SingleColumnLayout>
      <ChatSession pendingMessage={state?.pendingMessage} />
    </SingleColumnLayout>
  );
};

export const config = defineRouteConfig({});

export default EnthusiastChatPage;

export const handle = {
  breadcrumb: ({ data }: UIMatch<AgentDetails>) => data.name,
};
