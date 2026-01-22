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
  buildAttestIdentityIx: () => buildAttestIdentityIx,
  buildInitializeSpaceIx: () => buildInitializeSpaceIx,
  buildLinkWalletIx: () => buildLinkWalletIx,
  buildRevokeIdentityIx: () => buildRevokeIdentityIx,
  buildUnlinkWalletIx: () => buildUnlinkWalletIx,
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
var VerificationPlatform = /* @__PURE__ */ ((VerificationPlatform3) => {
  VerificationPlatform3[VerificationPlatform3["Discord"] = 0] = "Discord";
  VerificationPlatform3[VerificationPlatform3["Telegram"] = 1] = "Telegram";
  VerificationPlatform3[VerificationPlatform3["Twitter"] = 2] = "Twitter";
  VerificationPlatform3[VerificationPlatform3["Email"] = 3] = "Email";
  return VerificationPlatform3;
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

// src/ix.ts
var import_web35 = require("@solana/web3.js");
var import_buffer2 = require("buffer");
var import_sha256 = require("@noble/hashes/sha256");
var import_utils = require("@noble/hashes/utils");
function u8(n) {
  return n & 255;
}
function i64le(n) {
  let x = BigInt.asIntN(64, n);
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}
function concatBytes2(...arrays) {
  const len = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}
function ixDisc(nameSnake) {
  return (0, import_sha256.sha256)((0, import_utils.utf8ToBytes)(`global:${nameSnake}`)).slice(0, 8);
}
function serPubkey(pk) {
  return pk.toBytes();
}
function serU8(n) {
  return new Uint8Array([u8(n)]);
}
function serArray32(a) {
  const b = a instanceof Uint8Array ? a : Uint8Array.from(a);
  if (b.length !== 32) throw new Error("Expected 32-byte array");
  return b;
}
function serPlatform(platform) {
  return serU8(platform);
}
function buildInitializeSpaceIx(args) {
  const programId = args.programId ?? PROGRAM_ID;
  const disc = ixDisc("initialize_space");
  const daoId = args.daoId;
  const salt32 = serArray32(args.salt);
  const data = import_buffer2.Buffer.from(concatBytes2(disc, serPubkey(daoId), salt32));
  const [spaceAcct] = deriveSpacePda(daoId);
  return {
    spaceAcct,
    ix: new import_web35.TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: true },
        { pubkey: args.authority, isSigner: true, isWritable: false },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: import_web35.SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data
    })
  };
}
function buildAttestIdentityIx(args) {
  const programId = args.programId ?? PROGRAM_ID;
  if (args.platform !== (args.platformSeed & 255)) {
    throw new Error("platformSeed must match platform enum discriminant");
  }
  const disc = ixDisc("attest_identity");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);
  const data = import_buffer2.Buffer.from(
    concatBytes2(
      disc,
      serPubkey(daoId),
      serPlatform(args.platform),
      serU8(args.platformSeed),
      idHash32,
      i64le(args.expiresAt)
    )
  );
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  return {
    spaceAcct,
    identity,
    ix: new import_web35.TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: true },
        // init_if_needed
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: import_web35.SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data
    })
  };
}
function buildRevokeIdentityIx(args) {
  const programId = args.programId ?? PROGRAM_ID;
  if (args.platform !== (args.platformSeed & 255)) {
    throw new Error("platformSeed must match platform enum discriminant");
  }
  const disc = ixDisc("revoke_identity");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);
  const data = import_buffer2.Buffer.from(
    concatBytes2(
      disc,
      serPubkey(daoId),
      serPlatform(args.platform),
      serU8(args.platformSeed),
      idHash32
    )
  );
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  return {
    spaceAcct,
    identity,
    ix: new import_web35.TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: true }
      ],
      data
    })
  };
}
function buildLinkWalletIx(args) {
  const programId = args.programId ?? PROGRAM_ID;
  const disc = ixDisc("link_wallet");
  const daoId = args.daoId;
  const walletHash32 = serArray32(args.walletHash);
  const idHash32 = serArray32(args.idHash);
  const data = import_buffer2.Buffer.from(concatBytes2(disc, serPubkey(daoId), walletHash32));
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  const [link] = deriveLinkPda(identity, walletHash32);
  return {
    spaceAcct,
    identity,
    link,
    ix: new import_web35.TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: false },
        { pubkey: args.wallet, isSigner: false, isWritable: false },
        // CHECK
        { pubkey: link, isSigner: false, isWritable: true },
        // init_if_needed
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: import_web35.SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data
    })
  };
}
function buildUnlinkWalletIx(args) {
  const programId = args.programId ?? PROGRAM_ID;
  const disc = ixDisc("unlink_wallet");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);
  const walletHash32 = serArray32(args.walletHash);
  const data = import_buffer2.Buffer.from(concatBytes2(disc, serPubkey(daoId)));
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  const [link] = deriveLinkPda(identity, walletHash32);
  return {
    spaceAcct,
    identity,
    link,
    ix: new import_web35.TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: false },
        { pubkey: link, isSigner: false, isWritable: true },
        // close
        { pubkey: args.recipient, isSigner: false, isWritable: true },
        { pubkey: import_web35.SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data
    })
  };
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
  buildAttestIdentityIx,
  buildInitializeSpaceIx,
  buildLinkWalletIx,
  buildRevokeIdentityIx,
  buildUnlinkWalletIx,
  deriveIdentityPda,
  deriveLinkPda,
  deriveSpacePda,
  fetchIdentity,
  fetchLinksForIdentity,
  fetchSpace,
  identityHash,
  walletHash
});
