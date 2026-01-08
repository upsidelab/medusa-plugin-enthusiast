import Medusa, {FetchArgs, FetchInput, Client, Admin, Store, Auth, Config, FetchError} from "@medusajs/js-sdk"
import {getBackendUrl} from "./utils";
import {toast} from "@medusajs/ui";

class CustomClient extends Client {
  async fetch<T extends any>(input: FetchInput, init?: FetchArgs): Promise<T> {
    try {
        const result = await super.fetch<T>(input, init);
        return result as T;
    } catch (error) {
        if (error instanceof FetchError) {
            toast.error("Operation failed.", {
                description: error.message,
                position: "top-right",
            });
        }
        throw error;
    }
  }
}

class CustomMedusa extends Medusa {
  public client: CustomClient
  public admin: Admin
  public store: Store
  public auth: Auth

  constructor(config: Config) {
    super(config);
    this.client = new CustomClient(config)
    this.admin = new Admin(this.client)
    this.store = new Store(this.client)
    this.auth = new Auth(this.client, config)
  }
}

export const enthusiastAdminSdk = new CustomMedusa({
    baseUrl: getBackendUrl(),
    debug: true,
    auth: {
        type: "session",
    },
})
export const adminSdk = new Medusa({
    baseUrl: getBackendUrl(),
    debug: true,
    auth: {
        type: "session",
    },
})