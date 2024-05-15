import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

export interface HistoryEntry {
  lastOpenDate: Date
  name: string
  code: string
}

export const useHistory = defineStore('product-history', () => {
  const history = useStorage<HistoryEntry[]>('product-history', [])

  const addHistoryEntry = (entry: HistoryEntry) => {
    // Check if the entry already exists in the history
    const existingEntry = history.value.find(
      (existing) => existing.code === entry.code
    );

    // If the entry does not exist, add it to the history
    if (!existingEntry) {
      history.value.push(entry);
    }
  }

  return {
    history,

    addHistoryEntry,
  }
})
