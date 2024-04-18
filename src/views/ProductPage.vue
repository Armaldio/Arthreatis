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

      <ion-modal id="rate-modal" :is-open="showAskModal">
        <div class="wrapper">
          <h1>Score</h1>

          <ion-list lines="none">
            <ion-item :button="true" :detail="false" @click="dismissAskModal(-2)">
              <span slot="start">😖</span>
              <ion-label>Néfaste</ion-label>
            </ion-item>
            <ion-item :button="true" :detail="false" @click="dismissAskModal(-1)">
              <span slot="start">☹️</span>
              <ion-label>Négatif</ion-label>
            </ion-item>
            <ion-item :button="true" :detail="false" @click="dismissAskModal(0)">
              <span slot="start">😐</span>
              <ion-label>Sans impact</ion-label>
            </ion-item>
            <ion-item :button="true" :detail="false" @click="dismissAskModal(1)">
              <span slot="start">☺️</span>
              <ion-label>Positif</ion-label>
            </ion-item>
            <ion-item :button="true" :detail="false" @click="dismissAskModal(2)">
              <span slot="start">😁</span>
              <ion-label>Bénéfique</ion-label>
            </ion-item>
          </ion-list>
        </div>
      </ion-modal>

      <ion-card>
        <div :style="{ display: 'flex', justifyContent: 'center' }">
          <img :height="200" :alt="name" :src="imageFrontURL" />
        </div>
        <ion-card-header>
          <ion-card-title>{{ name }}</ion-card-title>
          <ion-card-subtitle>{{ description }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <div class="loading" v-if="isLoading">Chargement...</div>
          <div class="product" v-else>
            <div class="nova" v-if="getNovaTranslation(product.nova_group)">
              <span :style="{ color: getNovaColors(product.nova_group) }">{{ getNovaTranslation(product.nova_group) }}</span>
            </div>
            <div class="nutriscore" v-if="product.nutriscore_grade">
              <span>Nutriscore {{ product.nutriscore_grade.toUpperCase() }}</span>
            </div>
            <div class="ingredients">
              <p>Ingrédients</p>
              <ion-list>
                <ion-item
                  v-for="ingredient in ingredients"
                  :key="ingredient.id"
                >
                  <!-- <ion-thumbnail slot="start">
                    <img
                      alt="Silhouette of mountains"
                      src="https://ionicframework.com/docs/img/demos/thumbnail.svg"
                    />
                  </ion-thumbnail> -->
                  <ion-label style="display: flex;">
                    <div :style="{ minWidth: '50px', }">{{ ingredient.percent_estimate }}%</div>
                    <div>- &nbsp;</div>
                    <div>{{ ingredient.text }}</div>
                  </ion-label>
                  <ion-button
                    @click="rateIngredient(ingredient)"
                    fill="clear"
                    color="dark"
                    v-if="score(ingredient.id) === undefined"
                  >
                    <ion-icon
                      slot="icon-only"
                      :icon="helpCircleOutline"
                    ></ion-icon>
                  </ion-button>
                  <ion-button v-if="score(ingredient.id) > 0" fill="clear" color="success">
                    <ion-icon
                      slot="icon-only"
                      :icon="checkmarkCircleOutline"
                    ></ion-icon>
                  </ion-button>
                  <ion-button v-if="score(ingredient.id) < 0" fill="clear" color="danger">
                    <ion-icon
                      slot="icon-only"
                      :icon="closeCircleOutline"
                    ></ion-icon>
                  </ion-button>
                  <ion-button v-if="score(ingredient.id) === 0" color="dark" fill="clear">
                    <ion-icon
                      slot="icon-only"
                      :icon="ellipseOutline"
                    ></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-list>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/models/db";
import { computed } from "vue";
import {
  helpCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  ellipseOutline,
} from "ionicons/icons";
import { Ingredient, Product } from "@/models/product";
import {
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonContent,
  IonTitle,
  IonCardHeader,
  IonCardSubtitle,
  IonCardContent,
  IonPage,
  IonIcon,
  IonLabel,
  IonItem,
  IonList,
  IonCard,
  IonCardTitle,
} from "@ionic/vue";
import { translations as novaTranslations, colors as novaColors } from '@/models/nova'

const getNovaTranslation = (novaGroup: number | undefined) => {
  if (novaGroup) {
    return novaTranslations[novaGroup]
  }
  return undefined
}

const getNovaColors = (novaGroup: number | undefined) => {
  if (novaGroup) {
    return novaColors[novaGroup]
  }
  return undefined
}

const route = useRoute();

const code = route.params.id;

const imageFrontURL = ref<string>("");
const name = ref<string>("");
const ingredients = ref<Ingredient[]>([]);
const ingredientsDb = ref<{ id: number; score: number; off_id: string }[]>([]);
const isLoading = ref(true);

const product = ref<Product>();

const showAskModal = ref(false);

const currentIngredient = ref<Ingredient>()

const rateIngredient = (ingredient: Ingredient) => {
  currentIngredient.value = ingredient
  showAskModal.value = true
}

const score = (productId: string, defaultValue: undefined | number = undefined) => {
  const found = ingredientsDb.value.find(i => i.off_id === productId)
  if (found) {
    return found.score
  }
  return defaultValue;
};

const description = computed(() => {
  return product.value?.generic_name_fr ?? product.value?.generic_name ?? "";
});

const dismissAskModal = async (value: number) => {
  console.log('value', value)
  const { data, error } = await supabase
    .from('ingredients')
    .upsert({ off_id: currentIngredient.value.id, score: value })
    .select()
  console.log('data', data)
  console.log('error', error)

  currentIngredient.value = undefined
  showAskModal.value = false
};

onMounted(async () => {
  isLoading.value = true;

  const { data: anonymouseSignInData, error } = await supabase.auth.signInAnonymously()
  console.log('result', { anonymouseSignInData, error })

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
    const { data: ingredientsDbValue, error } = await supabase
      .from("ingredients")
      .select("*")
      .in(
        "off_id",
        ingredients.value.map((i) => i.id)
      );
    console.log("ingredientsDbValue", ingredientsDbValue);
    console.log("error", error);
    ingredientsDb.value = ingredientsDbValue
  }
  isLoading.value = false;
});
</script>

<style scoped>
ion-modal#rate-modal {
  --width: fit-content;
  --min-width: 250px;
  --height: fit-content;
  --border-radius: 6px;
  --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
}

ion-modal#rate-modal h1 {
  margin: 20px 20px 10px 20px;
}

ion-modal#rate-modal ion-icon {
  margin-right: 6px;

  width: 48px;
  height: 48px;

  padding: 4px 0;

  color: #aaaaaa;
}

ion-modal#rate-modal .wrapper {
  margin-bottom: 10px;
}
</style>
