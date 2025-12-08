import { MedusaService } from "@medusajs/framework/utils"
import {PluginOptions} from "../../settings";
import {ApiClient} from "./api/client";

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

}