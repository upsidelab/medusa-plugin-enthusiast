import { useLocation } from "react-router-dom";
import {ChatSession} from "../../../../../../../components/chat/chat-session.tsx";

import {defineRouteConfig} from "@medusajs/admin-sdk";

const EnthusiastChatPage = () => {
  const { state } = useLocation();
  return (<ChatSession pendingMessage={state?.pendingMessage} />)
}

export const config = defineRouteConfig({})

export default EnthusiastChatPage
