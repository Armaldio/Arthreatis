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

      <ion-button @click="startScan">Start Scan</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

const checkPermission = async () => {
  // check or request permission
  const status = await BarcodeScanner.checkPermission({ force: true });

  if (status.granted) {
    // the user granted permission
    return true;
  }

  return false;
};

const startScan = async () => {
  await checkPermission()

  // Check camera permission
  // This is just a simple example, check out the better checks below
  await BarcodeScanner.checkPermission({ force: true });

  // make background of WebView transparent
  // note: if you are using ionic this might not be enough, check below
  BarcodeScanner.hideBackground();

  const result = await BarcodeScanner.startScan(); // start scanning and wait for a result

  // if the result has content
  if (result.hasContent) {
    console.log(result.content); // log the raw scanned content
  }
};
</script>
