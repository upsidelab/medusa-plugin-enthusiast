import {
    FocusModal,
    Heading,
    Label,
    Input,
    Button,
    Select, toast, Kbd, IconButton,
} from "@medusajs/ui"
import {
  useForm,
  FormProvider,
  Controller,
} from "react-hook-form"
import * as zod from "zod"
import {PostCreateDatasetSchema} from "../../api/admin/datasets/validators";
import {useEffect, useState} from "react";
import {adminApiClient} from "../../admin/lib/admin-client";
import {ProvidersConfig} from "../../modules/enthusiast/api/types/config";
import {XMarkMini} from "@medusajs/icons";

type DatasetCreateFormProps = {
    setRefetch?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DatasetCreateForm = ({ setRefetch }: DatasetCreateFormProps) => {
  const [providersConfig, setProvidersConfig] = useState<ProvidersConfig | undefined>(undefined);
  const [languageModelNames, setLanguageModelNames] = useState<string[] | undefined>(undefined);
  const [embeddingModels, setEmbeddingModels] = useState<string[] | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false)
  const form = useForm<zod.infer<typeof PostCreateDatasetSchema>>({
    defaultValues: {
      name: "",
      language_model_provider: "",
      language_model: "",
      embedding_provider: "",
      embedding_model: "",
      embedding_vector_dimensions: 512,
    },
  })
  useEffect(() => {
    const loadProvidersConfig = async () => {
      const result = await adminApiClient.config().getAvailableProviders();
      setProvidersConfig(result);

      if (!form.getValues('language_model_provider') && result.languageModelProviders.length > 0) {
        form.setValue("language_model_provider", result.languageModelProviders[0]);
      }
      if (!form.getValues('embedding_provider') && result.embeddingProviders.length > 0) {
        form.setValue("embedding_provider", result.embeddingProviders[0]);
      }
    }

    loadProvidersConfig();
  }, []);

  const languageModelProvider = form.watch('language_model_provider');

  useEffect(() => {
    const loadLanguageModels = async () => {
      if (languageModelProvider) {
        setLanguageModelNames(undefined);
        const result = await adminApiClient.config().getLanguageModelsForProvider(languageModelProvider);
        setLanguageModelNames(result);

        const current = form.getValues("language_model");
        if (result.length > 0 && (!current || !result.includes(current))) {
          form.setValue("language_model", result[0]);
        }
      }
    }
    loadLanguageModels();
  }, [languageModelProvider]);

  const embeddingProvider = form.watch('embedding_provider');

  useEffect(() => {
    const loadEmbeddingModels = async () => {
      if (embeddingProvider) {
        setEmbeddingModels(undefined);
        const result = await adminApiClient.config().getEmbeddingModelsForProvider(embeddingProvider);
        setEmbeddingModels(result);

        const current = form.getValues("embedding_model");
        if (result.length > 0 && (!current || !result.includes(current))) {
          form.setValue("embedding_model", result[0]);
        }
      }
    }
    loadEmbeddingModels();
  }, [embeddingProvider]);



  const handleSubmit = form.handleSubmit(async (payload) => {
    const dataset = await adminApiClient.enthusiastDatasets().create(payload)
    await adminApiClient.dataSets().setAsActive(dataset.id);
    if (setRefetch) {
      setRefetch(true)
    }
    form.reset()
    setFormOpen(false)
    toast.success("Success", {
      description: `Dataset "${dataset.name}" created successfully`,
      position: "top-right",
    })

  })

  return (
    <FocusModal open={formOpen} onOpenChange={setFormOpen}>
      <FocusModal.Trigger asChild>
        <Button variant="secondary">Create</Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-x-4">
            <FocusModal.Close asChild>
                <IconButton
                    size="small"
                    variant="transparent"
                    className="text-ui-contrast-fg-secondary hover:text-ui-contrast-fg-primary hover:bg-ui-contrast-bg-base-hover active:bg-ui-contrast-bg-base-pressed focus-visible:bg-ui-contrast-bg-base-hover focus-visible:shadow-borders-interactive-with-active"
                >
                <XMarkMini />
                </IconButton>
            </FocusModal.Close>
            </div>
        </FocusModal.Header>

        <FormProvider {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex h-full flex-col overflow-hidden"
          >
            <FocusModal.Body>
                <div className="flex flex-1 flex-col items-center overflow-y-auto">
                  <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
                    <div>
                      <Heading className="capitalize">
                        Create Item
                      </Heading>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Controller
                        control={form.control}
                        name="name"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Name
                                </Label>
                              </div>
                              <Input {...field} />
                            </div>
                          )
                        }}
                      />
                      <Controller
                        control={form.control}
                        name="language_model_provider"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Language Model Provider
                                </Label>
                              </div>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={(v) => {
                                  field.onChange(v)
                                  form.resetField("language_model")
                                }}
                              >
                                <Select.Trigger>
                                  <Select.Value placeholder="Select a provider" />
                                </Select.Trigger>
                                <Select.Content>
                                  {providersConfig?.languageModelProviders?.length ? (
                                    providersConfig.languageModelProviders.map((name) => (
                                      <Select.Item key={name} value={name}>
                                        {name}
                                      </Select.Item>
                                    ))
                                  ) : (
                                    <Select.Item disabled value="__empty_lm_provider__">
                                      {providersConfig ? "No providers found" : "Loading..."}
                                    </Select.Item>
                                  )}
                                </Select.Content>
                              </Select>

                            </div>
                          )
                        }}
                      />
                      <Controller
                        control={form.control}
                        name="language_model"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Language Model
                                </Label>
                              </div>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}
                                disabled={!languageModelProvider}
                              >
                                <Select.Trigger>
                                  <Select.Value placeholder={languageModelProvider ? "Select a model" : "Select provider first"} />
                                </Select.Trigger>
                                <Select.Content>
                                  {languageModelNames?.length ? (
                                    languageModelNames.map((name) => (
                                      <Select.Item key={name} value={name}>
                                        {name}
                                      </Select.Item>
                                    ))
                                  ) : (
                                    <Select.Item disabled value="__empty_lm__">
                                      {languageModelNames ? "No models found" : "Loading..."}
                                    </Select.Item>
                                  )}
                                </Select.Content>
                              </Select>
                            </div>
                          )
                        }}
                      />
                      <Controller
                        control={form.control}
                        name="embedding_provider"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Embedding Provider
                                </Label>
                              </div>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={(v) => {
                                  field.onChange(v)
                                  form.resetField("embedding_model")
                                }}
                              >
                                <Select.Trigger>
                                  <Select.Value placeholder="Select a provider" />
                                </Select.Trigger>
                                <Select.Content>
                                  {providersConfig?.embeddingProviders?.length ? (
                                    providersConfig.embeddingProviders.map((name) => (
                                      <Select.Item key={name} value={name}>
                                        {name}
                                      </Select.Item>
                                    ))
                                  ) : (
                                    <Select.Item disabled value="__empty_embed_provider__">
                                      {providersConfig ? "No providers found" : "Loading..."}
                                    </Select.Item>
                                  )}
                                </Select.Content>
                              </Select>
                            </div>
                          )
                        }}
                      />
                      <Controller
                        control={form.control}
                        name="embedding_model"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Embedding Model
                                </Label>
                              </div>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}
                                disabled={!embeddingProvider}
                              >
                                <Select.Trigger>
                                  <Select.Value placeholder={embeddingProvider ? "Select a model" : "Select provider first"} />
                                </Select.Trigger>
                                <Select.Content>
                                  {embeddingModels?.length ? (
                                    embeddingModels.map((name) => (
                                      <Select.Item key={name} value={name}>
                                        {name}
                                      </Select.Item>
                                    ))
                                  ) : (
                                    <Select.Item disabled value="__empty_embed_model__">
                                      {embeddingModels ? "No models found" : "Loading..."}
                                    </Select.Item>
                                  )}
                                </Select.Content>
                              </Select>
                            </div>
                          )
                        }}
                      />
                      <Controller
                        control={form.control}
                        name="embedding_vector_dimensions"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Embedding Provider Dimensions
                                </Label>
                              </div>
                              <Input
                                type="number"
                                value={Number.isFinite(field.value) ? String(field.value) : ""}
                                onChange={(e) => {
                                  const v = e.target.value
                                  field.onChange(v === "" ? 0 : Number(v))
                                }}
                              />
                            </div>
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
            </FocusModal.Body>
            <FocusModal.Footer>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                    <Button size="small" variant="secondary">
                      Cancel
                    </Button>
                </FocusModal.Close>
                  <Button type="submit" size="small">
                    Save
                  </Button>
              </div>
            </FocusModal.Footer>
          </form>
        </FormProvider>
      </FocusModal.Content>
    </FocusModal>
  )
}