import { Heading, Text, Container } from "@medusajs/ui";
import { Check } from "@medusajs/icons";
import { Agent } from "../../modules/enthusiast/api/types/agent";
import { cn } from "../../admin/lib/utils";

interface AgentListProps {
  agents: Agent[];
  currentAgentId?: number;
  onAgentClick: (agentId: number) => void;
}

export function AgentList({ agents, currentAgentId, onAgentClick }: AgentListProps) {
  return (
    <Container className="h-full flex flex-col">
      <Heading level="h3" className="text-lg font-medium">
        List of Agents
      </Heading>
      <div 
        className="space-y-1 flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden pt-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {agents.map((agent) => {
          const isSelected = currentAgentId === agent.id;
          
          return (
            <button
              key={agent.id}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-ui-bg-base-hover transition-colors",
                isSelected && "bg-muted"
              )}
              onClick={() => onAgentClick(agent.id)}
            >
              {isSelected && <Check className="w-4 h-4" />}
              {!isSelected && <div className="w-4 h-4" />}
              <span className="flex-1 text-left">{agent.name}</span>
            </button>
          );
        })}
      </div>
    </Container>
  );
}
