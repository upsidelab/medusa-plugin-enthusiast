import { useNavigate } from "react-router-dom";
import {NewChat} from "../../../../../../components/chat/new-chat.tsx";
import {Message} from "../../../../../../components/chat/message-composer.tsx";
import { useParams } from "react-router-dom";

import {defineRouteConfig} from "@medusajs/admin-sdk";


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
