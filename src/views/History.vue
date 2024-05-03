<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>History</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">History</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-button class="link" v-for="item in history" :router-link="{ name: 'HistoryProduct', params: { id: item.code }}">
        {{ item.name }}
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
} from "@ionic/vue";
import { storeToRefs } from 'pinia'

import { useHistory } from '@/store/history'

const historyStore = useHistory()

const { history } = storeToRefs(historyStore)
</script>


<style scoped lang="scss">
.link {
  display: block;
  margin: 8px 16px;
}
</style>