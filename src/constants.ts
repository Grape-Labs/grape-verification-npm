import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "Ev4pb62pHYcFHLmV89JRcgQtS39ndBia51X9ne9NmBkH"
);

// Platform enum must match on-chain discriminants
export enum VerificationPlatform {
  Discord = 0,
  Telegram = 1,
  Twitter = 2,
  Email = 3,
}

// Domain separation tags (must match Rust)
export const TAG_WALLET = "wallet";
export const TAG_DISCORD = "discord";
export const TAG_TELEGRAM = "telegram";
export const TAG_TWITTER = "twitter";
export const TAG_EMAIL = "email";