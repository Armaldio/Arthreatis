<template>
  <ion-page>
    <ion-content>
      <div class="loading" v-if="isLoading">Chargement...</div>
      <div class="product" v-else>
        <div class="name">{{ name }}</div>
        <img class="image" :src="imageFrontURL" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const code = route.params.id;

const imageFrontURL = ref<string>("");
const name = ref<string>("");
const isLoading = ref(true);

onMounted(async () => {
  isLoading.value = true;
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
    name.value = product.product_name;
  }
  isLoading.value = false;
});
</script>

<style scoped></style>
