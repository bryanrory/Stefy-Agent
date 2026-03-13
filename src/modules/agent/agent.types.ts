export interface AgentToolCall {
  type: "tool";
  tool: string;
  input: Record<string, any>;
}

export interface AgentTextResponse {
  type: "text";
  text: string;
}

export type AgentDecision = AgentToolCall | AgentTextResponse;

export interface AgentResult {
  decision: AgentDecision;
  result: any;
}
