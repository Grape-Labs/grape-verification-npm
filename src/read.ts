import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants.js";
import { deriveSpaceMetadataPda, deriveSpacePda } from "./pda.js";

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

export async function fetchSpaceMetadata(
  connection: Connection,
  spaceMetadata: PublicKey
) {
  return connection.getAccountInfo(spaceMetadata);
}

export async function fetchSpaceMetadataByDaoId(
  connection: Connection,
  daoId: PublicKey
) {
  const [space] = deriveSpacePda(daoId);
  const [spaceMetadata] = deriveSpaceMetadataPda(space);
  return connection.getAccountInfo(spaceMetadata);
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
