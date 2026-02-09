// src/constants.ts
import { PublicKey } from "@solana/web3.js";
var PROGRAM_ID = new PublicKey(
  "VrFyyRxPoyWxpABpBXU4YUCCF9p8giDSJUv2oXfDr5q"
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

// src/fetch.ts
import { PublicKey as PublicKey5 } from "@solana/web3.js";
import { sha256 as sha2562 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";
import { Buffer as Buffer2 } from "buffer";
function accountDiscriminator(name) {
  return sha2562(utf8ToBytes(`account:${name}`)).slice(0, 8);
}
var LINK_ACCOUNT_DISC = accountDiscriminator("GrapeVerificationLink");
function parseLink(data) {
  if (data.length < 88) {
    throw new Error(`Link account data too short: ${data.length} bytes`);
  }
  const version = data[8];
  const identity = new PublicKey5(data.slice(9, 41));
  const walletHash2 = data.slice(41, 73);
  const linkedAtBigInt = data.readBigInt64LE(73);
  const bump = data[81];
  return {
    version,
    identity,
    walletHash: walletHash2,
    linkedAt: Number(linkedAtBigInt),
    bump
  };
}
async function fetchLinkedWallets(connection, identityPda, currentWalletHash, programId = PROGRAM_ID) {
  try {
    const discBase64 = Buffer2.from(LINK_ACCOUNT_DISC).toString("base64");
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: discBase64,
            encoding: "base64"
          }
        },
        {
          memcmp: {
            offset: 9,
            bytes: identityPda.toBase58()
            // base58 is default for pubkeys
          }
        }
      ]
    });
    const currentHex = currentWalletHash ? bytesToHex(currentWalletHash) : null;
    const wallets = accounts.map((account) => {
      const parsed = parseLink(account.account.data);
      const whHex = bytesToHex(parsed.walletHash);
      return {
        pubkey: account.pubkey,
        walletHashBytes: parsed.walletHash,
        walletHashHex: whHex,
        linkedAt: parsed.linkedAt,
        identity: parsed.identity,
        isCurrentWallet: currentHex !== null && whHex === currentHex
      };
    });
    return wallets.sort((a, b) => a.linkedAt - b.linkedAt);
  } catch (error) {
    console.error("fetchLinkedWallets error:", error);
    return [];
  }
}
function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function fetchLink(connection, linkPda) {
  try {
    const accountInfo = await connection.getAccountInfo(linkPda);
    if (!accountInfo) return null;
    return parseLink(accountInfo.data);
  } catch (error) {
    console.error("fetchLink error:", error);
    return null;
  }
}

// src/ix.ts
import { SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { Buffer as Buffer3 } from "buffer";
import { sha256 as sha2563 } from "@noble/hashes/sha256";
import { utf8ToBytes as utf8ToBytes2 } from "@noble/hashes/utils";
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
  return sha2563(utf8ToBytes2(`global:${nameSnake}`)).slice(0, 8);
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
  const data = Buffer3.from(concatBytes2(disc, serPubkey(daoId), salt32));
  const [spaceAcct] = deriveSpacePda(daoId);
  return {
    spaceAcct,
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: true },
        { pubkey: args.authority, isSigner: true, isWritable: false },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  const data = Buffer3.from(
    concatBytes2(
      disc,
      // 8 bytes
      serPubkey(daoId),
      // 32 bytes - THIS WAS MISSING!
      serPlatform(args.platform),
      // 1 byte
      serU8(args.platformSeed),
      // 1 byte
      idHash32,
      // 32 bytes
      i64le(args.expiresAt)
      // 8 bytes
    )
  );
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  return {
    spaceAcct,
    identity,
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: true },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  const data = Buffer3.from(
    concatBytes2(
      disc,
      // 8 bytes
      serPubkey(daoId),
      // 32 bytes - THIS WAS MISSING!
      serPlatform(args.platform),
      // 1 byte
      serU8(args.platformSeed),
      // 1 byte
      idHash32
      // 32 bytes
    )
  );
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  return {
    spaceAcct,
    identity,
    ix: new TransactionInstruction({
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
  const data = Buffer3.from(
    concatBytes2(
      disc,
      // 8 bytes
      serPubkey(daoId),
      // 32 bytes - THIS WAS MISSING!
      serU8(args.platformSeed),
      // 1 byte
      idHash32,
      // 32 bytes
      walletHash32
      // 32 bytes
    )
  );
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  const [link] = deriveLinkPda(identity, walletHash32);
  return {
    spaceAcct,
    identity,
    link,
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: false },
        { pubkey: args.wallet, isSigner: false, isWritable: false },
        { pubkey: link, isSigner: false, isWritable: true },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data
    })
  };
}
function buildLinkWalletSelfIx(args) {
  const programId = args.programId ?? PROGRAM_ID;
  const disc = ixDisc("link_wallet_self");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);
  const walletHash32 = serArray32(args.walletHash);
  const data = Buffer3.from(
    concatBytes2(
      disc,
      serPubkey(daoId),
      serU8(args.platformSeed),
      idHash32,
      walletHash32
    )
  );
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  const [link] = deriveLinkPda(identity, walletHash32);
  return {
    spaceAcct,
    identity,
    link,
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: false },
        { pubkey: args.wallet, isSigner: true, isWritable: false },
        // ✅ signer
        { pubkey: link, isSigner: false, isWritable: true },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  const data = Buffer3.from(
    concatBytes2(
      disc,
      // 8 bytes
      serPubkey(daoId),
      // 32 bytes - THIS WAS MISSING!
      serU8(args.platformSeed),
      // 1 byte
      idHash32,
      // 32 bytes
      walletHash32
      // 32 bytes
    )
  );
  const [spaceAcct] = deriveSpacePda(daoId);
  const [identity] = deriveIdentityPda(spaceAcct, args.platformSeed, idHash32);
  const [link] = deriveLinkPda(identity, walletHash32);
  return {
    spaceAcct,
    identity,
    link,
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: false },
        { pubkey: link, isSigner: false, isWritable: true },
        { pubkey: args.recipient, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data
    })
  };
}
export {
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
  buildLinkWalletSelfIx,
  buildRevokeIdentityIx,
  buildUnlinkWalletIx,
  deriveIdentityPda,
  deriveLinkPda,
  deriveSpacePda,
  fetchIdentity,
  fetchLink,
  fetchLinkedWallets,
  fetchLinksForIdentity,
  fetchSpace,
  identityHash,
  parseLink,
  walletHash
};
