<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tab 1</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 1</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- <ion-button @click="startScan">Start Scan</ion-button> -->
      <qrcode-stream @detect="onDetect" :formats="formats"></qrcode-stream>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/vue";
import { QrcodeStream } from 'vue-qrcode-reader'

import { useIonRouter } from '@ionic/vue';

const ionRouter = useIonRouter();

const formats = [
  "aztec",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "databar",
  "databar_expanded",
  "data_matrix",
  "dx_film_edge",
  "ean_13",
  "ean_8",
  "itf",
  "maxi_code",
  "micro_qr_code",
  "pdf417",
  "qr_code",
  "rm_qr_code",
  "upc_a",
  "upc_e",
  "linear_codes",
  "matrix_codes"
]

const onDetect = (detectedCodes: Array<{ rawValue: string}>) => {
  console.log('detectedCodes', detectedCodes)
  const firstValue = detectedCodes[0]
  if (firstValue) {
    onFound(firstValue.rawValue)
  }
}

const onFound = async (code: string) => {
  ionRouter.push({
    name: 'ProductPage',
    params: {
      id: code
    }
  },)
}
</script>
