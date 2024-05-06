<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
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
          <div class="llm-suggestion" v-html="llmSuggestionMarkdown"></div>
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
            <div class="scores">
              <div class="nova" v-if="getNovaTranslation(product.nova_group)">
                <span> Nova </span>
                <div class="nova" v-bind="novaProps" ref="$nova"></div>
                <span>
                  .
                  <!-- {{ getNovaTranslation(product.nova_group) }} -->
                </span>
              </div>
              <div class="prScore">
                <span> PR Score </span>
                <div class="prScore" v-bind="prScoreProps" ref="$prScore"></div>
                <span> . </span>
              </div>
              <div class="nutriscore" v-if="product.nutriscore_grade">
                <span> Nutriscore </span>
                <div class="nutriscore" v-bind="nutriscoreProps" ref="$nutriscore"></div>
                <span> . </span>
              </div>
            </div>
            <div class="ingredients">
              <div>Reprères nutritionnels</div>
              <div>Matiere grasse: {{ product.nutrient_levels.fat }}</div>
              <div>
                Acides gras saturés:
                {{ product.nutrient_levels["saturated-fat"] }}
              </div>
              <div>Sucre: {{ product.nutrient_levels.sugars }}</div>
              <div>Sel: {{ product.nutrient_levels.salt }}</div>
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
import { Ref, onMounted, ref, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/models/db";
import { computed } from "vue";
import { Ingredient, IngredientBase, Product } from "@/models/product";
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
  IonBackButton,
  IonButtons,
  IonLabel,
  IonItem,
  IonList,
  IonCard,
  IonCardTitle,
} from "@ionic/vue";
import {
  translations as novaTranslations,
  colors as novaColors,
} from "@/models/nova";
import { useIngredients } from "@/store/ingredients";
import Ingredients from "@/components/Ingredients.vue";
import Groq from "groq-sdk";
import { micromark } from "micromark";
import ProgressBar from "progressbar.js";
import { storeToRefs } from "pinia";
import { useHistory } from "@/store/history";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const getNovaTranslation = (
  novaGroup: keyof typeof novaTranslations | undefined
) => {
  if (novaGroup) {
    return novaTranslations[novaGroup];
  }
  return undefined;
};

const getNovaColors = (
  novaGroup: keyof typeof novaTranslations | undefined
) => {
  if (novaGroup) {
    return novaColors[novaGroup];
  }
  return undefined;
};

const route = useRoute();

const code = route.params.id;

const imageFrontURL = ref<string>("");
const name = ref<string>("");
const isLoading = ref(true);

const llmSuggestion = ref("");

const product = ref<Product>();

const showAskModal = ref(false);

const currentIngredient = ref<Ingredient>();

const $nutriscore = ref<HTMLDivElement>();
const $nova = ref<HTMLDivElement>();
const $prScore = ref<HTMLDivElement>();

const createProgressBar = (
  ref: Ref<HTMLDivElement | undefined>,
  value: number,
  options: Ref<ProgressBar.PathDrawingOptions> | undefined = undefined
) => {
  const bar = shallowRef<InstanceType<typeof ProgressBar.Circle>>()
  watch(
    ref,
    (element) => {
      if (element) {
        bar.value = new ProgressBar.Circle(element, options?.value);

        bar.value?.animate(value); // Number from 0.0 to 1.0
      }
    },
    {
      immediate: true,
    }
  );

  const props = computed(() => {
    return {
      class: ["radial-progress"],
    };
  });

  return {
    modelValue: ref,
    props,
    bar,
  };
};

const nutriscoreOptions = computed(
  () =>
  ({
    color: "#aaa",
    // This has to be the same size as the maximum width to
    // prevent clipping
    strokeWidth: 12,
    trailWidth: 0,
    easing: "easeInOut",
    duration: 1400,
    text: {
      value: product.value?.nutriscore_grade.toUpperCase(),
    },
    from: { color: "#aaa" /* width: 1 */ },
    to: { color: "#333" /* width: 4 */ },
    // Set default step function for all animate calls
    step: function (state, circle) {
      // circle.path.setAttribute("stroke", state.color);
      // circle.path.setAttribute("stroke-width", state.width);
      // var value = Math.round(circle.value() * 100);
      // if (value === 0) {
      //   circle.setText("");
      // } else {
      //   circle.setText(value);
      // }
    },
  } satisfies ProgressBar.PathDrawingOptions)
);

const { modelValue: nutriscoreEl, props: nutriscoreProps } = createProgressBar(
  $nutriscore,
  1,
  nutriscoreOptions
);

const novaOptions = computed(
  () =>
  ({
    color: getNovaColors(product.value?.nova_group),
    // This has to be the same size as the maximum width to
    // prevent clipping
    strokeWidth: 12,
    trailWidth: 0,
    easing: "easeInOut",
    duration: 1400,
    text: {
      value: product.value?.nova_group.toString(),
    },
    from: { color: "#aaa" /* width: 1 */ },
    to: { color: "#333" /* width: 4 */ },
    // Set default step function for all animate calls
    step: function (state, circle) {
      // circle.path.setAttribute("stroke", state.color);
      // circle.path.setAttribute("stroke-width", state.width);
      // var value = Math.round(circle.value() * 100);
      // if (value === 0) {
      //   circle.setText("");
      // } else {
      //   circle.setText(value);
      // }
    },
  } satisfies ProgressBar.PathDrawingOptions)
);

const { modelValue: novaEl, props: novaProps } = createProgressBar(
  $nova,
  1,
  novaOptions
);

const prScoreOptions = computed(
  () =>
  ({
    color: prScoreColor.value,
    // This has to be the same size as the maximum width to
    // prevent clipping
    strokeWidth: 12,
    trailWidth: 0,
    easing: "easeInOut",
    duration: 1400,
    text: {
      value: `${prScore.value?.toString()}%` ?? '?',
    },
    from: { color: "#aaa" /* width: 1 */ },
    to: { color: "#333" /* width: 4 */ },
    // Set default step function for all animate calls
    step: function (state, circle) {
      // circle.path.setAttribute("stroke", state.color);
      // circle.path.setAttribute("stroke-width", state.width);
      // var value = Math.round(circle.value() * 100);
      // if (value === 0) {
      //   circle.setText("");
      // } else {
      //   circle.setText(value);
      // }
    },
  } satisfies ProgressBar.PathDrawingOptions)
);

const rateIngredient = async (ingredient: Ingredient) => {
  currentIngredient.value = ingredient;
  llmSuggestion.value = "";
  showAskModal.value = true;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        // "content": "Act like a dietician. You specialize in rheumatoid arthritis.\nI will provide you with a list of ingredients and you will aim to rate them in order to determine their effects on the symptoms of the disease.\nChoose values between:\n- Harmful\n- Negative\n- No impact\n- Positive\n- Beneficial\n\nThe score given must take into account:\n- Reduction of inflammation\n- Pain reduction\n- Improved joint mobility\n- Reduction of fatigue\n\nGives a unique score per ingredient with a short comment (20 characters max) that explains this choice.\n\nHere is the first ingredient to rate: "
        content:
          "Agit comme un diététicien. Tu te spécialise dans la polyarthrite rhumatoïde. Je te fournirai une liste d'ingrédients et tu devra les évaluer afin de déterminer leurs effets sur les symptômes de la maladie. \NChoisis une valeurs entre : \n- Nocif \n- Négatif \n- Sans impact \n- Positif \n- Bénéfique \nLa note attribuée doit prendre en compte: \n- Réduction de l'inflammation \n- Réduction de la douleur \n- Amélioration de la mobilité des articulations \n- Réduction de la fatigue \nCela donne une note unique par ingrédient avec un court commentaire (20 caractères maximum) qui explique ce choix.\nVoici le premier ingrédient à noter: ",
      },
      {
        role: "user",
        content: currentIngredient.value.text,
      },
    ],
    model: "llama3-70b-8192",
    temperature: 1,
    max_tokens: 1024,
    top_p: 1,
    stream: true,
    stop: null,
  });

  for await (const chunk of chatCompletion) {
    const data = chunk.choices[0]?.delta?.content || "";
    llmSuggestion.value += data;
  }
};

const llmSuggestionMarkdown = computed(() => {
  return micromark(llmSuggestion.value);
});

const description = computed(() => {
  return product.value?.generic_name_fr ?? product.value?.generic_name ?? "";
});

const getColorFromValue = (value: number): string => {
  // Validate input
  if (value < 0 || value > 100) {
    throw new Error('Input value must be between 0 and 100');
  }

  // Calculate the red and green components based on the input value
  const red = Math.round(255 * (100 - value) / 100);
  const green = Math.round(255 * value / 100);

  // Convert the red and green components to hexadecimal strings
  const redHex = red.toString(16).padStart(2, '0');
  const greenHex = green.toString(16).padStart(2, '0');

  // Return the color as a hexadecimal string
  return `#${redHex}${greenHex}00`;
}

const prScoreColor = computed(() => {
  return prScore.value ? getColorFromValue(prScore.value) : 'grey'
})

const extractIngredients = (item: { ingredients: Ingredient[] }) => {
  const allIngredients: Ingredient[] = [];

  for (const itemIngredient of item.ingredients) {
    allIngredients.push(
      ...extractIngredients({
        ingredients: [],
        ...itemIngredient,
      })
    );
  }

  allIngredients.push(...item.ingredients);

  return allIngredients;
};

const allIngredients = computed(() => {
  const extracted = extractIngredients(product.value ?? { ingredients: [] });
  console.log("extracted", extracted);
  return extracted.sort();
});

const ingredients = computed(() => {
  return product.value?.ingredients ?? [];
});

const dismissAskModal = async (value: number) => {
  const ingr = currentIngredient.value;

  if (ingr) {
    console.log("value", value);

    // add rating to db
    const { data, error } = await supabase
      .from("ingredients")
      .upsert({ off_id: ingr.id, score: value })
      .select();
    console.log("data", data);
    console.log("error", error);

    for (const newIngr of data ?? []) {
      addIngredient(newIngr);
    }
  }

  currentIngredient.value = undefined;
  showAskModal.value = false;
};

const ingredientStore = useIngredients();

const { addIngredient, setIngredient } = ingredientStore;
const { ingredientsDb } = storeToRefs(ingredientStore);

/**
 * If return is undefined: we ignore the score
 */
const getFinalIngredientScore = (ingredient: IngredientBase): number | undefined => {
  const found = ingredientsDb.value.find((i) => i.off_id === ingredient.id);
  if (found) {
    return found.score === null ? undefined : found.score;
  }
  return undefined;
}

const getIngredientScore = (ingredient: IngredientBase): number | undefined => {
  if ((ingredient.ingredients ?? []).length > 0) {
    const scores: number[] = []
    for (const subingredient of ingredient.ingredients ?? []) {
      const ingredientScore = getIngredientScore(subingredient)
      if (ingredientScore) {
        scores.push(ingredientScore)
      }
      // else, ignore ingredient
    }

    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = (sum / scores.length) || 0;
    return avg
  } else {
    return getFinalIngredientScore(ingredient)
  }
}

// [-2, 2] => [0, 100]
const mapRange = (x: number) => (x + 2) * 25;

const prScore = computed<number | undefined>(() => {
  const absoluteScore = product.value ? getIngredientScore(product.value) : undefined

  if (absoluteScore) {
    return Math.round(mapRange(absoluteScore))
  }
  return undefined
})

const { modelValue: prScoreEl, props: prScoreProps, bar: prBar } = createProgressBar(
  $prScore,
  (prScore.value ?? 100) / 100,
  prScoreOptions
);

watch(prScore, () => {
  if (prBar.value) {
    prBar.value.setText(prScore.value?.toString() ?? '?')
    prBar.value.animate((prScore.value ?? 100) / 100)
  }
})

const historyStore = useHistory()
console.log('historyStore', historyStore)
const { addHistoryEntry } = historyStore

onMounted(async () => {
  isLoading.value = true;

  const { data: anonymouseSignInData, error } =
    await supabase.auth.signInAnonymously();
  console.log("result", { anonymouseSignInData, error });

  const dataRaw = await fetch(
    "https://fr.openfoodfacts.org/api/v2/product/" +
    code +
    "?cc=fr&lc=fr&tags_lc=fr"
  );
  const data = await dataRaw.json() as { status: 1 | 0; product: Product };

  console.log("data", data);

  if (data.status === 1) {
    product.value = data.product;

    imageFrontURL.value = product.value?.image_front_url ?? "";
    name.value =
      product.value?.product_name_fr ?? product.value?.product_name ?? "";

    addHistoryEntry({
      lastOpenDate: new Date(),
      code: data.product.code,
      name: name.value
    })

    // fetch scores
    const { data: ingredientsDbValue, error } = await supabase
      .from("ingredients")
      .select("*")
      .in(
        "off_id",
        allIngredients.value.map((i) => i.id)
      );
    console.log("ingredientsDbValue", ingredientsDbValue);
    console.log("error", error);

    if (ingredientsDbValue) {
      for (const ingredient of ingredientsDbValue) {
        addIngredient(ingredient);
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

.radial-progress {
  width: 48px;
  height: 48px;
}

.scores {
  display: flex;
  flex-direction: row;
  justify-content: space-around;

  .nova,
  .nutriscore,
  .prScore {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
    text-align: center;
  }
}

.ingredients {
  margin-top: 16px;
}
</style>
