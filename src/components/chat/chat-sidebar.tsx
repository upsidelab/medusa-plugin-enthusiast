import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApiClient } from "../../admin/lib/admin-client";
import { useActiveDataset } from "../../admin/hooks/use-active-dataset";
import { Agent } from "../../modules/enthusiast/api/types/agent";
import { Conversation } from "../../modules/enthusiast/api/types/conversation";
import { AgentList } from "./agent-list";
import { ConversationHistory } from "./conversation-history";
import { LoadingSpinner } from "../../components/utils/spinner";

interface ChatSidebarProps {
  currentAgentId: number;
  currentConversationId?: number;
}

export function ChatSidebar({ currentAgentId, currentConversationId }: ChatSidebarProps) {
  const { dataset, isLoading: isDatasetLoading } = useActiveDataset();
  const dataSetId = dataset?.external_id ?? null;
  const navigate = useNavigate();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);

  // Load agents only when the active dataset changes
  useEffect(() => {
    if (isDatasetLoading || !dataSetId) return;

    const loadAgents = async () => {
      try {
        setIsAgentsLoading(true);
        const agentsRes = await adminApiClient.agents().getDatasetAgents(dataSetId);
        setAgents(agentsRes.filter((agent) => !agent.corrupted));
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setIsAgentsLoading(false);
      }
    };

    void loadAgents();
  }, [dataSetId, isDatasetLoading]);

  // Reload conversations when the agent or active conversation changes (background, no spinner)
  useEffect(() => {
    if (!dataSetId || !currentAgentId) return;

    const loadConversations = async () => {
      try {
        const conversationsRes = await adminApiClient
          .conversations()
          .getConversations(dataSetId, currentAgentId, 1);
        setConversations(conversationsRes.results || []);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };

    void loadConversations();
  }, [dataSetId, currentAgentId, currentConversationId]);

  const handleAgentClick = (agentId: number) => {
    navigate(`/enthusiast/chat/new?agent=${encodeURIComponent(agentId)}`);
  };

  const handleConversationClick = (conversationId: number) => {
    navigate(`/enthusiast/chat/${conversationId}`);
  };

  const handleNewChat = () => {
    navigate(`/enthusiast/chat/new?agent=${encodeURIComponent(currentAgentId)}`);
  };

  if (isAgentsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-64 bg-background flex flex-col h-full overflow-hidden">
      <div className="px-2 pt-2 h-[40%] min-h-0 pb-4">
        <AgentList
          agents={agents}
          currentAgentId={currentAgentId}
          onAgentClick={handleAgentClick}
        />
      </div>
      <div className="px-2 pb-2 h-[60%] min-h-0">
        <ConversationHistory
          conversations={conversations.slice(0, 10)}
          currentConversationId={currentConversationId}
          onConversationClick={handleConversationClick}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}
