import { z } from "zod";

export const PostCreateDatasetSchema = z.object({
  name: z.string().nonempty(),
  language_model_provider: z.string(),
  language_model: z.string(),
  embedding_provider: z.string(),
  embedding_model: z.string(),
  embedding_vector_dimensions: z.number(),
  preconfigure_agents: z.boolean(),
});
