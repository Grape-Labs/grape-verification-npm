import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "VrFyyRxPoyWxpABpBXU4YUCCF9p8giDSJUv2oXfDr5q"
);

export const COMMUNITY_METADATA_MAX_LEN = 256;

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
