import { sha256 } from "@noble/hashes/sha2.js";
import { PublicKey } from "@solana/web3.js";
import { TAG_WALLET } from "./constants.js";

function concatBytes(...arrays: Uint8Array[]) {
  const len = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

/**
 * sha256( salt || "wallet" || wallet_pubkey )
 */
export function walletHash(
  spaceSalt: Uint8Array,
  wallet: PublicKey
): Uint8Array {
  return sha256(
    concatBytes(
      spaceSalt,
      new TextEncoder().encode(TAG_WALLET),
      wallet.toBytes()
    )
  );
}

/**
 * sha256( salt || platformTag || platformUserId )
 */
export function identityHash(
  spaceSalt: Uint8Array,
  platformTag: string,
  platformUserId: string | Uint8Array
): Uint8Array {
  const idBytes =
    typeof platformUserId === "string"
      ? new TextEncoder().encode(platformUserId)
      : platformUserId;

  return sha256(
    concatBytes(
      spaceSalt,
      new TextEncoder().encode(platformTag),
      idBytes
    )
  );
}