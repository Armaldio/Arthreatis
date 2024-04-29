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

      <ion-modal id="rate-modal" :is-open="showAskModal" @didDismiss="showAskModal = false">
        <div class="wrapper">
          <h1>Score</h1>

          <ion-list lines="none">
            <ion-item :button="true" :detail="false" @click="dismissAskModal(-2)">
              <span slot="start">😖</span>
              <ion-label>Nocif</ion-label>
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
          <div class="llm-suggestion" v-html="llmSuggestionMarkdown">
          </div>
        </div>
      </ion-modal>

      <ion-card v-if="product">
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
              <Ingredients @rate="rateIngredient($event)" :ingredients="ingredients"></Ingredients>
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
import { useIngredients } from "@/store/ingredients";
import { storeToRefs } from "pinia";
import Ingredients from '@/components/Ingredients.vue'
import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';
import { useCompletion } from 'ai/vue';
import Groq from 'groq-sdk';
import { micromark } from "micromark";

const Hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

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
const isLoading = ref(true);

const llmSuggestion = ref('')

const product = ref<Product>();

const showAskModal = ref(false);

const currentIngredient = ref<Ingredient>()

const rateIngredient = async (ingredient: Ingredient) => {
  currentIngredient.value = ingredient
  llmSuggestion.value = ''
  showAskModal.value = true

  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "system",
        // "content": "Act like a dietician. You specialize in rheumatoid arthritis.\nI will provide you with a list of ingredients and you will aim to rate them in order to determine their effects on the symptoms of the disease.\nChoose values between:\n- Harmful\n- Negative\n- No impact\n- Positive\n- Beneficial\n\nThe score given must take into account:\n- Reduction of inflammation\n- Pain reduction\n- Improved joint mobility\n- Reduction of fatigue\n\nGives a unique score per ingredient with a short comment (20 characters max) that explains this choice.\n\nHere is the first ingredient to rate: "
        "content": "Agit comme un diététicien. Tu te spécialise dans la polyarthrite rhumatoïde. Je te fournirai une liste d'ingrédients et tu devra les évaluer afin de déterminer leurs effets sur les symptômes de la maladie. \NChoisis une valeurs entre : \n- Nocif \n- Négatif \n- Sans impact \n- Positif \n- Bénéfique \nLa note attribuée doit prendre en compte: \n- Réduction de l'inflammation \n- Réduction de la douleur \n- Amélioration de la mobilité des articulations \n- Réduction de la fatigue \nCela donne une note unique par ingrédient avec un court commentaire (20 caractères maximum) qui explique ce choix.\nVoici le premier ingrédient à noter: "
      },
      {
        "role": "user",
        "content": currentIngredient.value.text
      },
    ],
    "model": "llama3-70b-8192",
    "temperature": 1,
    "max_tokens": 1024,
    "top_p": 1,
    "stream": true,
    "stop": null
  });

  for await (const chunk of chatCompletion) {
    const data = chunk.choices[0]?.delta?.content || ''
    llmSuggestion.value += data
  }
}

const llmSuggestionMarkdown = computed(() => {
  return micromark(llmSuggestion.value)
})

const description = computed(() => {
  return product.value?.generic_name_fr ?? product.value?.generic_name ?? "";
});

const ingredients = computed(() => {
  return product.value?.ingredients ?? [];
})

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

const ingredientStore = useIngredients()

const { addIngredient } = ingredientStore

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

    if (ingredientsDbValue) {
      for (const ingredient of ingredientsDbValue) {
        addIngredient(ingredient)
      }
    }
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

.llm-suggestion {
  max-width: 40vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 8px 16px;

  p {
    margin: 0 !important;
  }
}
</style>
