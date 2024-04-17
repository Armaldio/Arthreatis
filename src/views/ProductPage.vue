<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ name }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ name }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-card>
        <img alt="Silhouette of mountains" :src="imageFrontURL" />
        <ion-card-header>
          <ion-card-title>{{ name }}</ion-card-title>
          <ion-card-subtitle>{{ description }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <div class="loading" v-if="isLoading">Chargement...</div>
          <div class="product" v-else>
            <div class="ingredients">
              <p>Ingrédients</p>
              <ion-list>
                <ion-item v-for="ingredient in ingredients" :key="ingredient.id">
                  <!-- <ion-thumbnail slot="start">
                    <img
                      alt="Silhouette of mountains"
                      src="https://ionicframework.com/docs/img/demos/thumbnail.svg"
                    />
                  </ion-thumbnail> -->
                  <ion-label>
                    {{ ingredient.text }}  -
                    {{ ingredient.percent_estimate * score(ingredient.id) }}
                  </ion-label>
                  <ion-button @click="showAskModal = true" fill="clear" color="dark">
                    <ion-icon slot="icon-only" :icon="helpCircleOutline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" color="success">
                    <ion-icon slot="icon-only" :icon="checkmarkCircleOutline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" color="danger">
                    <ion-icon slot="icon-only" :icon="closeCircleOutline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" color="warning">
                    <ion-icon slot="icon-only" :icon="warningOutline"></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-list>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>

    <ion-modal :is-open="showAskModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="showAskModal = false">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Welcome</ion-title>
          <ion-buttons slot="end">
            <ion-button :strong="true" @click="confirmAskModal">Confirm</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-item>
          <ion-input
            label="Enter your name"
            label-placement="stacked"
            ref="input"
            type="text"
            placeholder="Your name"
          ></ion-input>
        </ion-item>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/models/db";
import { computed } from "vue";
import { helpCircleOutline, checkmarkCircleOutline, closeCircleOutline, warningOutline } from 'ionicons/icons';
import { Ingredient, Product } from "@/models/product";

const route = useRoute();

const code = route.params.id;

const imageFrontURL = ref<string>("");
const name = ref<string>("");
const ingredients = ref<Ingredient[]>([]);
const isLoading = ref(true);

const product = ref<Product>();

const showAskModal = ref(false)

const description = computed(() => {
  return product.value?.generic_name_fr ?? product.value?.generic_name ?? "";
});

const confirmAskModal = () => {

}

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
    product.value = data.product;

    imageFrontURL.value = product.value?.image_front_url ?? "";
    name.value =
      product.value?.product_name_fr ?? product.value?.product_name ?? "";
    ingredients.value = product.value?.ingredients ?? [];

    // fetch scores
    const { data: ingredientsDb, error } = await supabase
      .from('ingredients')
      .select("*")
      .in('off_id', ingredients.value.map(i => i.id))
    console.log('ingredientsDb', ingredientsDb)
    console.log('error', error)
  }
  isLoading.value = false;
});
</script>

<style scoped></style>
