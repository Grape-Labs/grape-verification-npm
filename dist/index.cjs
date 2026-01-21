"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PROGRAM_ID: () => PROGRAM_ID,
  TAG_DISCORD: () => TAG_DISCORD,
  TAG_EMAIL: () => TAG_EMAIL,
  TAG_TELEGRAM: () => TAG_TELEGRAM,
  TAG_TWITTER: () => TAG_TWITTER,
  TAG_WALLET: () => TAG_WALLET,
  VerificationPlatform: () => VerificationPlatform,
  deriveIdentityPda: () => deriveIdentityPda,
  deriveLinkPda: () => deriveLinkPda,
  deriveSpacePda: () => deriveSpacePda,
  fetchIdentity: () => fetchIdentity,
  fetchLinksForIdentity: () => fetchLinksForIdentity,
  fetchSpace: () => fetchSpace,
  identityHash: () => identityHash,
  walletHash: () => walletHash
});
module.exports = __toCommonJS(index_exports);

// src/constants.ts
var import_web3 = require("@solana/web3.js");
var PROGRAM_ID = new import_web3.PublicKey(
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
var import_sha2 = require("@noble/hashes/sha2.js");
var import_web32 = require("@solana/web3.js");
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
  return (0, import_sha2.sha256)(
    concatBytes(
      spaceSalt,
      new TextEncoder().encode(TAG_WALLET),
      wallet.toBytes()
    )
  );
}
function identityHash(spaceSalt, platformTag, platformUserId) {
  const idBytes = typeof platformUserId === "string" ? new TextEncoder().encode(platformUserId) : platformUserId;
  return (0, import_sha2.sha256)(
    concatBytes(
      spaceSalt,
      new TextEncoder().encode(platformTag),
      idBytes
    )
  );
}

// src/pda.ts
var import_web33 = require("@solana/web3.js");
var import_buffer = require("buffer");
function deriveSpacePda(daoId) {
  return import_web33.PublicKey.findProgramAddressSync(
    [import_buffer.Buffer.from("space"), daoId.toBytes()],
    PROGRAM_ID
  );
}
function deriveIdentityPda(space, platformSeed, idHash) {
  return import_web33.PublicKey.findProgramAddressSync(
    [
      import_buffer.Buffer.from("identity"),
      space.toBytes(),
      import_buffer.Buffer.from([platformSeed]),
      import_buffer.Buffer.from(idHash)
    ],
    PROGRAM_ID
  );
}
function deriveLinkPda(identity, walletHash2) {
  return import_web33.PublicKey.findProgramAddressSync(
    [
      import_buffer.Buffer.from("link"),
      identity.toBytes(),
      import_buffer.Buffer.from(walletHash2)
    ],
    PROGRAM_ID
  );
}

// src/read.ts
var import_web34 = require("@solana/web3.js");
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
