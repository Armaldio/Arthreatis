<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Recherche</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Recherche</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-searchbar :debounce="250" @ionInput="handleInput($event)"></ion-searchbar>

      <ion-list>
        <ion-item v-for="product in results" :href="`/product/${product.code}`">
          <ion-thumbnail slot="start">
            <img :alt="product.product_name" :src="product.image_front_url ?? ''" />
          </ion-thumbnail>

          <ion-label>{{ product.product_name_fr ?? product.product_name }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonItem, IonList, IonSearchbar, SearchbarInputEventDetail } from '@ionic/vue';
import { IonSearchbarCustomEvent } from '@ionic/core';
import { defineComponent, ref } from 'vue';

import { useIonRouter } from '@ionic/vue';
import { Product } from '@/models/product';

const ionRouter = useIonRouter();

const results = ref<Product[]>([]);

const search = async (searchTerm: string) => {
  const dataRaw = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerm}&search_simple=1&action=process&json=1`)
  const data = await dataRaw.json() as {
    products: Product[]
  }
  return data.products
}

const handleInput = async (event: IonSearchbarCustomEvent<SearchbarInputEventDetail>) => {
  const query = event.target.value?.toLowerCase() ?? '';

  results.value = await search(query)
}
</script>
