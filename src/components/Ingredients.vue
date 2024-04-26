<template>
  <ion-list>
    <IngredientVue
      @rate="emit('rate', $event)"
      v-for="ingredient in ingredients"
      :key="ingredient.id"
      :ingredient="ingredient"
    ></IngredientVue>
  </ion-list>
</template>

<script lang="ts" setup>
import { Ingredient } from "@/models/product";
import { PropType } from "vue";

import IngredientVue from "./Ingredient.vue";

const props = defineProps({
  ingredients: {
    type: Array as PropType<Ingredient[]>,
    required: true,
  },
});

const emit = defineEmits<{
  (event: "rate", ingredient: Ingredient): void;
}>();
</script>
