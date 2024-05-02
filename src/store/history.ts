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
    history.value.push(entry)
  }

  return {
    history,

    addHistoryEntry,
  }
})
