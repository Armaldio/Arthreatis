import { defineStore } from "pinia";
import { readonly, ref } from "vue";

export interface IngredientDb {
    id: number;
    score: number | null;
    off_id: string
}

export const useIngredients = defineStore('ingredients', () => {
    const ingredientsDb = ref<IngredientDb[]>([]);

    const addIngredient = (ingredient: IngredientDb) => {
        ingredientsDb.value.push(ingredient)
    }

    return {
        ingredientsDb: readonly(ingredientsDb),
        addIngredient,
    }
})