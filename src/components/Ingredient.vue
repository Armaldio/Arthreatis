<template>
  <ion-item class="item">
    <ion-label style="display: flex">
      <div class="percent"><b>{{ formatPercentage(ingredient.percent_estimate) }}</b></div>
      <div>&nbsp;</div>
      <div v-html="text"></div>
    </ion-label>
    <ion-button
      @click="$emit('rate', ingredient)"
      fill="clear"
      color="dark"
      v-if="score === undefined || score === null"
    >
      <ion-icon slot="icon-only" :icon="helpCircleOutline"></ion-icon>
    </ion-button>
    <ion-button
      v-else-if="score > 0"
      fill="clear"
      color="success"
    >
      <ion-icon slot="icon-only" :icon="checkmarkCircleOutline"></ion-icon>
    </ion-button>
    <ion-button
      v-else-if="score < 0"
      fill="clear"
      color="danger"
    >
      <ion-icon slot="icon-only" :icon="closeCircleOutline"></ion-icon>
    </ion-button>
    <ion-button
      v-else-if="score === 0"
      color="dark"
      fill="clear"
    >
      <ion-icon slot="icon-only" :icon="ellipseOutline"></ion-icon>
    </ion-button>
  </ion-item>
  <div class="sub-ingredients" v-if="subIngredients.length > 0">
    <Ingredients @rate="emit('rate', $event)" :ingredients="subIngredients"></Ingredients>
  </div>
</template>

<script lang="ts">
export default {
  name: "Ingredient"
}
</script>

<script lang="ts" setup>
import { Ingredient } from "@/models/product";
import { PropType, computed, toRef, toRefs } from "vue";
import {
  IonButton,
  IonIcon,
  IonLabel,
  IonItem,
} from "@ionic/vue";
import {
  helpCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  ellipseOutline,
} from "ionicons/icons";
import { useIngredients } from "@/store/ingredients";
import { storeToRefs } from "pinia";
import Ingredients from '@/components/Ingredients.vue'
import { micromark } from 'micromark'

const ingredientStore = useIngredients();
const { ingredientsDb } = storeToRefs(ingredientStore);

const props = defineProps({
  ingredient: {
    type: Object as PropType<Ingredient>,
    required: true,
  },
});

const emit = defineEmits<{
  (event: "rate", ingredient: Ingredient): void;
}>();

const { ingredient } = toRefs(props)

const text = computed(() => {
  return micromark(ingredient.value.text)
})

const subIngredients = computed(() => {
  return ingredient.value?.ingredients ?? []
})

const score = computed(() => {
  const found = ingredientsDb.value.find((i) => i.off_id === ingredient.value.id);
  if (found) {
    return found.score;
  }
  return undefined;
})

const formatPercentage = (percentage: number) => {
  // Convert the percentage to a number
  const number = percentage;

  // Use toFixed(2) to round the number to 2 decimal places
  const fixedNumber = number.toFixed(2);

  // Separate the integer and decimal parts
  const [integerPart, decimalPart] = fixedNumber.split(".");

  // Pad the integer part with leading zeros if needed
  const paddedIntegerPart = integerPart.padStart(2, "0");

  // Pad the decimal part with trailing zeros if needed
  const paddedDecimalPart = decimalPart.padEnd(2, "0");

  // Combine the padded parts with a decimal separator
  const formattedPercentage = `${paddedIntegerPart}.${paddedDecimalPart}%`;

  return formattedPercentage;
};
</script>

<style scoped lang="scss">
.item {
  display: flex;
}

.sub-ingredients {
  margin-left: 32px;
}

.percent {
  margin-right: 8px;
  font-size: 12px;
  display: flex;
  align-items: baseline;
}
</style>
