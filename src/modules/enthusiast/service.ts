import { MedusaService } from "@medusajs/framework/utils"
import {PluginOptions} from "../../settings";
import {ApiClient} from "./api/client";
import {
  Conversation,
  CreateMessagePayload,
  FeedbackData,
  FileUploadResponse,
  FileUploadStatusResponse,
  PaginatedResult,
  SupportedFileTypes,
  TaskHandle
} from "./api/types/conversation";
import {AgentDetails} from "./api/types/agent";

export default class EnthusiastService extends MedusaService({}){
  protected options_: PluginOptions

  constructor({}, options: PluginOptions) {
    super(...arguments)

    this.options_ = options
  }
  apiClient = () => {
    return new ApiClient(this.options_.enthusiastApiUrl, this.options_.enthusiastServiceAccountToken)
  }

  list = () => {
    console.log(this.options_)
    return this.options_
  }
  isConnected = (): boolean => {
    return !!(this.options_.enthusiastApiUrl && this.options_.enthusiastServiceAccountToken);
  }
  listAgents = async (dataSetId: number) => {
    return await this.apiClient().agents().getDatasetAvailableAgents(dataSetId)
  }

  listDatasets = async () => {
    return await this.apiClient().dataSets().getDataSets()
  }

  getAgentById = async (agentId: number): Promise<AgentDetails> => {
    return await this.apiClient().agents().getAgentById(agentId)
  }

  getConversations = async (dataSetId: number, page: number = 1): Promise<PaginatedResult<Conversation>> => {
    return await this.apiClient().conversations().getConversations(dataSetId, page)
  }

  createConversation = async (agentId: number): Promise<number> => {
    return await this.apiClient().conversations().createConversation(agentId)
  }

  getConversation = async (conversationId: number): Promise<Conversation> => {
    return await this.apiClient().conversations().getConversation(conversationId)
  }

  sendMessage = async (conversationId: number, dataSetId: number, message: string, streaming: boolean, fileIds?: number[]): Promise<TaskHandle> => {
    return await this.apiClient().conversations().sendMessage(conversationId, dataSetId, message, streaming, fileIds)
  }

  getTaskStatus = async (taskHandle: TaskHandle): Promise<string> => {
    return await this.apiClient().conversations().getTaskStatus(taskHandle)
  }

  fetchResponseMessage = async (conversationId: number, taskHandle: TaskHandle) => {
    return await this.apiClient().conversations().fetchResponseMessage(conversationId, taskHandle)
  }

  updateMessageFeedback = async (messageId: number, feedbackData: FeedbackData): Promise<void> => {
    return await this.apiClient().conversations().updateMessageFeedback(messageId, feedbackData)
  }

  getSupportedFileTypes = async (): Promise<SupportedFileTypes> => {
    return await this.apiClient().conversations().getSupportedFileTypes()
  }

  uploadFile = async (conversationId: number, file: Express.Multer.File): Promise<FileUploadResponse> => {
    const fileObj = new File(
      [file.buffer],
      file.originalname,
      { type: file.mimetype }
    );
    return await this.apiClient().conversations().uploadFile(conversationId, fileObj)
  }

  getFileUploadStatus = async (taskId: string): Promise<FileUploadStatusResponse> => {
    return await this.apiClient().conversations().getFileUploadStatus(taskId)
  }

}