import { config } from "dotenv";

let loaded = false;

export function loadEnv() {
  if (loaded) {
    return;
  }

  config();
  loaded = true;
}
