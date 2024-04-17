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

import { useRouter } from "vue-router";

const router = useRouter()

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
let video: HTMLVideoElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let stream: MediaStream | null = null;
const frameInterval = 100;

const startScan = () => {
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((mediaStream) => {
      console.log('mediaStream', mediaStream)
      video = document.querySelector("#video");
      console.log('video', video)
      if (video) {
        video.srcObject = mediaStream;
        video.play();
        canvas = document.querySelector("#canvas");

        if (canvas) {
          context = canvas.getContext("2d");
          stream = mediaStream;
          setTimeout(detectBarcode, frameInterval);
        }
      }
    })
    .catch((err) => console.error(err));
};

const detectBarcode = async () => {
  if (!video || !context || !stream || !canvas) {
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const imageBitmap = await createImageBitmap(imageData);

  console.log('imageBitmap', imageBitmap)

  barcodeDetector.detect(imageBitmap).then((barcodes) => {
    console.log('barcodes', barcodes)
    if (barcodes.length > 0) {
      onFound(barcodes[0].rawValue)

      if (!stream) {
        return;
      }

      stream.getTracks().forEach((track) => track.stop());
      video = null;
      canvas = null;
      context = null;
      stream = null;
    } else {
      setTimeout(detectBarcode, frameInterval);
    }
  });
};

const onDetect = (detectedCodes: Array<{ rawValue: string}>) => {
  console.log('detectedCodes', detectedCodes)
  const firstValue = detectedCodes[0]
  if (firstValue) {
    onFound(firstValue.rawValue)
  }
}

const onFound = async (code: string) => {
  router.push({
    name: 'ProductPage',
    params: {
      id: code
    }
  })
}
</script>
