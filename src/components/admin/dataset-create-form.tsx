import {
    FocusModal,
    Heading,
    Label,
    Input,
    Button, Select,
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


export const DatasetCreateForm = () => {
  const [providersConfig, setProvidersConfig] = useState<ProvidersConfig | undefined>(undefined);
  const [languageModelNames, setLanguageModelNames] = useState<string[] | undefined>(undefined);
  const [embeddingModels, setEmbeddingModels] = useState<string[] | undefined>(undefined);
  const form = useForm<zod.infer<typeof PostCreateDatasetSchema>>({
    defaultValues: {
      name: "",
    },
  })
  useEffect(() => {
    const loadProvidersConfig = async () => {
      const result = await adminApiClient.config().getAvailableProviders();
      setProvidersConfig(result);

      // Set default values if not already set
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

        // Set default value if not already set
        if (!form.getValues('language_model') && result.length > 0) {
          form.setValue("language_model", result[0]);
        }
      }
    }
    loadLanguageModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageModelProvider]);

  const embeddingProvider = form.watch('embedding_provider');

  useEffect(() => {
    const loadEmbeddingModels = async () => {
      if (embeddingProvider) {
        setEmbeddingModels(undefined);
        const result = await adminApiClient.config().getEmbeddingModelsForProvider(embeddingProvider);
        setEmbeddingModels(result);

        // Set default value if not already set
        if (!form.getValues('embedding_model') && result.length > 0) {
          form.setValue("embedding_model", result[0]);
        }
      }
    }
    loadEmbeddingModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddingProvider]);



  const handleSubmit = form.handleSubmit(({ name }) => {
    // TODO: submit to backend
    console.log(name)
  })

  return (
    <FocusModal>
      <FocusModal.Trigger asChild>
        <Button>Create</Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FormProvider {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex h-full flex-col overflow-hidden"
          >
            <FocusModal.Header>
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
            </FocusModal.Header>
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
                                value={field.value || ""}
                                onValueChange={field.onChange}
                              >
                                <Select.Trigger>
                                  <Select.Value placeholder="Select a product" />
                                </Select.Trigger>
                                <Select.Content>
                                  {providersConfig?.languageModelProviders?.map((name) => (
                                    <Select.Item key={name} value={name}>
                                      {name}
                                    </Select.Item>
                                  ))}
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
                              <Input {...field} />
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
                              <Input {...field} />
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
                              <Input {...field} />
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
                              <Input {...field} />
                            </div>
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
            </FocusModal.Body>
          </form>
        </FormProvider>
      </FocusModal.Content>
    </FocusModal>
  )
}