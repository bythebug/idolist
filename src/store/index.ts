import { createIdolistStore } from "@idolist/core";
import { localStorageAdapter } from "@/lib/storage";

export const useStore = createIdolistStore(localStorageAdapter);

export type { IdolistStore } from "@idolist/core";
