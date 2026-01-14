import {UIMatch, useLocation} from "react-router-dom";
import {ChatSession} from "../../../../../../../components/chat/chat-session.tsx";

import {defineRouteConfig} from "@medusajs/admin-sdk";
import {AgentDetails} from "../../../../../../../modules/enthusiast/api/types/agent.ts";

const EnthusiastChatPage = () => {
  const { state } = useLocation();
  return (<ChatSession pendingMessage={state?.pendingMessage} />)
}

export const config = defineRouteConfig({})

export default EnthusiastChatPage

export const handle = {
  breadcrumb: ({data}: UIMatch<AgentDetails>) => data.name,
}