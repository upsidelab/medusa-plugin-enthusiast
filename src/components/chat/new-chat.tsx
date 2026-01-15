import { useState, useEffect } from "react";
import {Navigate, useLocation, useNavigate, useParams} from "react-router-dom";
import {Agent, AgentDetails} from "../../modules/enthusiast/api/types/agent";
import {Message, OnSubmit} from "./message-composer";
import {PageMain} from "../utils/page-main";
import {PageHeading} from "../utils/page-heading";
import {ChatWindow} from "./chat-window";
import {adminApiClient} from "../../admin/lib/admin-client";
import {LoadingSpinner} from "../../components/utils/spinner";
import {toast} from "@medusajs/ui";

interface NewChatProps {
  onPendingMessage: (message: Message, conversationId: number)=>void;
}

export function NewChat({ onPendingMessage }: NewChatProps) {
    const { dataSetId: dataset } = useParams();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const agent = queryParams.get("agent");
    if (!agent) {
    toast.info("No agent.", {
      description: "Choose an agent to start a chat."
    });

    return <Navigate to="/enthusiast" replace />;
  }
    const agentId = agent ? parseInt(agent, 10) : null;
    const datasetId = dataset ? parseInt(dataset, 10) : null;

    const [isLoading, setIsLoading] = useState(true)
    const [agents, setAgents] = useState<Agent[]>([])
    const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null)

    useEffect(() => {
        const fetchDatasetAgents = async () => {
              try {
                setIsLoading(true)
                const res = await adminApiClient.agents().getDatasetAgents(datasetId!)
                setAgents(res)
              } finally {
                setIsLoading(false)
              }
            }
        const fetchAgentDetails = async () => {
              try {
                setIsLoading(true)
                const res = await adminApiClient.agents().getAgentById(agentId!)
                setAgentDetails(res)
              } finally {
                setIsLoading(false)
              }
        }
            fetchDatasetAgents()
            fetchAgentDetails()
    }, [dataset])
  const selectedAgent = agentId ? agents.find(agentObj => agentObj.id === agentId) : null;

  const emptyState = (() => {
    if (agents.length === 0) {
      return {
        title: 'No Agents Available',
        description: 'There are currently no agents available for this dataset.',
        pageTitle: 'No Agents Available',
        pageDescription: 'There are currently no agents for this dataset.'
      };
    }

    if (!agentId) {
      return {
        title: 'No Agent Selected',
        description: 'Please choose an agent from the sidebar to start a new conversation.',
        pageTitle: 'Choose Agent',
        pageDescription: 'Select an agent to start a conversation.'
      };
    }
    
    if (!selectedAgent) {
      return {
        title: 'Agent Not Found',
        description: 'The selected agent could not be found or may have been removed.',
        pageTitle: 'Agent Not Found',
        pageDescription: 'The requested agent is not available.'
      };
    }

    return false;
  })();

  const onSubmit: OnSubmit = async (message, createdConversationId) => {
    const conversationId = createdConversationId || await adminApiClient.conversations().createConversation(selectedAgent!.id)
    onPendingMessage(message, conversationId);
  }
  if (isLoading) {
      return (<LoadingSpinner/>)
  }

  return (
    <PageMain>
      <PageHeading
        title={emptyState && emptyState.title || selectedAgent!.name}
        description={emptyState && emptyState.description || 'Start a new conversation.'}
        className="flex-shrink-0 pt-4 bg-background z-[1] px-8"
      />
      {
        emptyState ? (
          <div className="flex flex-col flex-1 overflow-y-auto px-4 pt-4">
            <div className="grow flex items-center justify-center">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">{emptyState.title}</h2>
                <p className="text-gray-600 max-w-md">
                  {emptyState.description}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ChatWindow className="flex-1 min-h-0 pt-4" onSubmit={onSubmit} isLoading={false} agentId={agentId ?? undefined} fileUploadEnabled={agentDetails?.file_upload}>
            <div className="grow flex items-start justify-center pt-16">
              {agentDetails?.description && (
                <div className="text-center space-y-4 max-w-2xl px-6">
                  <div className="bg-background rounded-lg p-6">
                    <p className="text-gray-500 text-base leading-relaxed">
                      {agentDetails.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ChatWindow>
        )
      }
    </PageMain>
  );
}
