// src/constants.ts
import { PublicKey } from "@solana/web3.js";
var PROGRAM_ID = new PublicKey(
  "Ev4pb62pHYcFHLmV89JRcgQtS39ndBia51X9ne9NmBkH"
);
var VerificationPlatform = /* @__PURE__ */ ((VerificationPlatform2) => {
  VerificationPlatform2[VerificationPlatform2["Discord"] = 0] = "Discord";
  VerificationPlatform2[VerificationPlatform2["Telegram"] = 1] = "Telegram";
  VerificationPlatform2[VerificationPlatform2["Twitter"] = 2] = "Twitter";
  VerificationPlatform2[VerificationPlatform2["Email"] = 3] = "Email";
  return VerificationPlatform2;
})(VerificationPlatform || {});
var TAG_WALLET = "wallet";
var TAG_DISCORD = "discord";
var TAG_TELEGRAM = "telegram";
var TAG_TWITTER = "twitter";
var TAG_EMAIL = "email";

// src/hashing.ts
import { sha256 } from "@noble/hashes/sha2.js";
import "@solana/web3.js";
function concatBytes(...arrays) {
  const len = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}
function walletHash(spaceSalt, wallet) {
  return sha256(
    concatBytes(
      spaceSalt,
      new TextEncoder().encode(TAG_WALLET),
      wallet.toBytes()
    )
  );
}
function identityHash(spaceSalt, platformTag, platformUserId) {
  const idBytes = typeof platformUserId === "string" ? new TextEncoder().encode(platformUserId) : platformUserId;
  return sha256(
    concatBytes(
      spaceSalt,
      new TextEncoder().encode(platformTag),
      idBytes
    )
  );
}

// src/pda.ts
import { PublicKey as PublicKey3 } from "@solana/web3.js";
import { Buffer } from "buffer";
function deriveSpacePda(daoId) {
  return PublicKey3.findProgramAddressSync(
    [Buffer.from("space"), daoId.toBytes()],
    PROGRAM_ID
  );
}
function deriveIdentityPda(space, platformSeed, idHash) {
  return PublicKey3.findProgramAddressSync(
    [
      Buffer.from("identity"),
      space.toBytes(),
      Buffer.from([platformSeed]),
      Buffer.from(idHash)
    ],
    PROGRAM_ID
  );
}
function deriveLinkPda(identity, walletHash2) {
  return PublicKey3.findProgramAddressSync(
    [
      Buffer.from("link"),
      identity.toBytes(),
      Buffer.from(walletHash2)
    ],
    PROGRAM_ID
  );
}

// src/read.ts
import "@solana/web3.js";
async function fetchSpace(connection, space) {
  return connection.getAccountInfo(space);
}
async function fetchIdentity(connection, identity) {
  return connection.getAccountInfo(identity);
}
async function fetchLinksForIdentity(connection, identity) {
  return connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { memcmp: { offset: 8 + 1, bytes: identity.toBase58() } }
    ]
  });
}
export {
  PROGRAM_ID,
  TAG_DISCORD,
  TAG_EMAIL,
  TAG_TELEGRAM,
  TAG_TWITTER,
  TAG_WALLET,
  VerificationPlatform,
  deriveIdentityPda,
  deriveLinkPda,
  deriveSpacePda,
  fetchIdentity,
  fetchLinksForIdentity,
  fetchSpace,
  identityHash,
  walletHash
};
