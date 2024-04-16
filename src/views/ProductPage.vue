<template>
  <ion-page>
    <ion-content>
      <div class="loading" v-if="isLoading">Chargement...</div>
      <div class="product" v-else>
        <div class="name">{{ name }}</div>
        <img class="image" :src="imageFrontURL" />
        <div class="ingredients">
          <p>Ingrédients</p>
          <ul>
            <li v-for="ingredient in ingredients" :key="ingredient.id">
              {{ ingredient.text }} - {{ ingredient.percent_estimate * score(ingredient.id) }}
            </li>
          </ul>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { scores } from '@/data/scores'
import { supabase } from '@/models/db'

const route = useRoute();

const code = route.params.id;

const imageFrontURL = ref<string>("");
const name = ref<string>("");
const ingredients = ref<unknown[]>([]);
const isLoading = ref(true);

const score = (id: string) => {
  if (id in scores) {
    return scores[id].score
  }
  return 1
}

onMounted(async () => {
  isLoading.value = true;

  const { data: dbIngredients } = await supabase.from('ingredients').select()
  console.log('dbIngredients', dbIngredients)

  const dataRaw = await fetch(
    "https://world.openfoodfacts.net/api/v2/product/" +
      code +
      "?cc=fr&lc=fr&tags_lc=fr"
  );
  const data = await dataRaw.json();

  console.log("data", data);

  if (data.status === 1) {
    const product = data.product;

    imageFrontURL.value = product.image_front_url;
    name.value = product.product_name_fr ?? product.product_name;
    ingredients.value = product.ingredients
  }
  isLoading.value = false;
});
</script>

<style scoped></style>
