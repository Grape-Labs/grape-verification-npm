import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants.js";
import { Buffer } from "buffer";

/**
 * Space PDA
 * seeds = ["space", daoId]
 */
export function deriveSpacePda(daoId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("space"), daoId.toBytes()],
    PROGRAM_ID
  );
}

/**
 * Identity PDA
 * seeds = ["identity", space, platform_seed, id_hash]
 */
export function deriveIdentityPda(
  space: PublicKey,
  platformSeed: number,
  idHash: Uint8Array
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("identity"),
      space.toBytes(),
      Buffer.from([platformSeed]),
      Buffer.from(idHash),
    ],
    PROGRAM_ID
  );
}

/**
 * Link PDA
 * seeds = ["link", identity, wallet_hash]
 */
export function deriveLinkPda(
  identity: PublicKey,
  walletHash: Uint8Array
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("link"),
      identity.toBytes(),
      Buffer.from(walletHash),
    ],
    PROGRAM_ID
  );
}