import {UIMatch, useNavigate, useParams, LoaderFunctionArgs} from "react-router-dom";
import {defineRouteConfig} from "@medusajs/admin-sdk";
import {NewChat} from "../../../../../../components/chat/new-chat.tsx";
import {Message} from "../../../../../../components/chat/message-composer.tsx";
import {enthusiastAdminSdk} from "../../../../../lib/sdk.ts";
import {AgentDetails} from "../../../../../../modules/enthusiast/api/types/agent.ts";
import {Conversation} from "../../../../../../modules/enthusiast/api/types/conversation.ts";


export type OnPendingMessage = (message: Message, conversationId: number) => void;

const EnthusiastNewChatPage = () => {
  const {dataSetId} = useParams()
  const navigate = useNavigate();

  const onPendingMessage: OnPendingMessage = (message, conversationId) => {
    navigate(`/enthusiast/dataset/${dataSetId}/chat/${conversationId}`, {
      state: {
        pendingMessage: message,
      }
    });
  }
  return (<NewChat onPendingMessage={onPendingMessage}/>)
}

export const config = defineRouteConfig({})

export default EnthusiastNewChatPage

export async function loader({request, params}: LoaderFunctionArgs) {
  if (params.chatId) {
    const conversation = await enthusiastAdminSdk.client.fetch<Conversation>(`/enthusiast/conversations/${params.chatId}`)
    return conversation.agent
  }
  const requestCopy = request.clone()
  const url = new URL(requestCopy.url)
  const searchParams = url.searchParams
  const agentId = searchParams.get("agent")
  return await enthusiastAdminSdk.client.fetch<AgentDetails>(
            `/enthusiast/agents/${agentId}`
        );
}

export const handle = {
  breadcrumb: ({data}: UIMatch<AgentDetails>) => data.name,
}