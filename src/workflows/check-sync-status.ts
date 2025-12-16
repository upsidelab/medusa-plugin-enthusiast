import {
    createWorkflow,
    WorkflowResponse,
    createStep, StepResponse,
} from "@medusajs/framework/workflows-sdk"
import EnthusiastService from "../modules/enthusiast/service";
import {ENTHUSIAST_MODULE} from "../modules/enthusiast";
import {EnthusiastDatasetType} from "../admin/lib/types";
import {SyncStatus} from "../modules/enthusiast/types";

export type syncDatasetStatusWorkflowInput = {
    datasetId: string;
}

const SUCCESS_STATUS = "SUCCESS";
const FAILURE_STATUS = "FAILURE";

const poolDatasetSyncStatusStep = createStep(
  {
      name: "pool-sync-status",
      async: true,
      backgroundExecution: true,
      timeout: 5 * 60
  },
  async ({ datasetId }: syncDatasetStatusWorkflowInput, { container }) => {
    const enthusiastService: EnthusiastService = container.resolve(ENTHUSIAST_MODULE)
    const datasets = await enthusiastService.listEnthusiastDatasets({id: datasetId})
    if (!datasets || !datasets.length) {
        return new StepResponse()
    }
    const dataset = datasets[0]
    if (!dataset.task_id) {
        return new StepResponse()
    }
    while (true) {
        const taskStatus = await enthusiastService.getTaskStatus({task_id: dataset.task_id, streaming: false})
        if (taskStatus === SUCCESS_STATUS) {
            await enthusiastService.updateEnthusiastDatasets({id:dataset.id, last_synced:new Date(), sync_status: SyncStatus.SUCCESS, task_id: null})
            return new StepResponse()
        }
        if (taskStatus === FAILURE_STATUS) {
            await enthusiastService.updateEnthusiastDatasets({id:dataset.id, last_synced:new Date(), sync_status: SyncStatus.FAILED, task_id: null})
            return new StepResponse()
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
)

export const syncDatasetStatusWorkflow = createWorkflow(
  {name: "sync-dataset-status-workflow"},
  function (input: syncDatasetStatusWorkflowInput) {
    poolDatasetSyncStatusStep(input)
    return new WorkflowResponse({})
  }
)

export default syncDatasetStatusWorkflow