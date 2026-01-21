import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants.js";

export async function fetchSpace(
  connection: Connection,
  space: PublicKey
) {
  return connection.getAccountInfo(space);
}

export async function fetchIdentity(
  connection: Connection,
  identity: PublicKey
) {
  return connection.getAccountInfo(identity);
}

export async function fetchLinksForIdentity(
  connection: Connection,
  identity: PublicKey
) {
  return connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { memcmp: { offset: 8 + 1, bytes: identity.toBase58() } }
    ],
  });
}