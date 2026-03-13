export interface ToolInputSchema {
  [field: string]: {
    type: string;
    description: string;
    required?: boolean;
    example?: any;
  };
}

export interface ToolContext {
  userId: number;
  phone: string;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema?: ToolInputSchema;
  execute: (input: any, context?: ToolContext) => Promise<any>;
}
