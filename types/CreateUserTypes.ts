export interface CreateChatResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data: {
    id: string;
    createdAt: string;
  };
}
