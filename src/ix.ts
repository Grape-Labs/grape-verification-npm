// ix.ts
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";

import { PROGRAM_ID, VerificationPlatform } from "./constants.js";
import { deriveSpacePda, deriveIdentityPda, deriveLinkPda } from "./pda.js";

/* ---------------- helpers ---------------- */

function u8(n: number) {
  return n & 0xff;
}

function i64le(n: bigint) {
  // signed i64 little-endian
  let x = BigInt.asIntN(64, n);
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

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
 * Anchor ix discriminator:
 * sha256("global:<snake_case_name>")[0..8]
 *
 * Your Rust names are snake_case:
 * - initialize_space
 * - attest_identity
 * - link_wallet
 * - revoke_identity
 * - unlink_wallet
 */
function ixDisc(nameSnake: string): Uint8Array {
  return sha256(utf8ToBytes(`global:${nameSnake}`)).slice(0, 8);
}

function serPubkey(pk: PublicKey) {
  return pk.toBytes();
}

function serU8(n: number) {
  return new Uint8Array([u8(n)]);
}

function serArray32(a: Uint8Array | number[]) {
  const b = a instanceof Uint8Array ? a : Uint8Array.from(a);
  if (b.length !== 32) throw new Error("Expected 32-byte array");
  return b;
}

/**
 * Anchor enum serialization for:
 * enum VerificationPlatform { Discord=0, Telegram=1, Twitter=2, Email=3 }
 *
 * Anchor encodes enums as a u8 variant index.
 */
function serPlatform(platform: VerificationPlatform): Uint8Array {
  return serU8(platform as number);
}

/* =============================================================================
 * buildInitializeSpaceIx
 * ============================================================================= */

export function buildInitializeSpaceIx(args: {
  daoId: PublicKey;
  salt: Uint8Array | number[]; // [u8;32]
  authority: PublicKey;        // signer
  payer: PublicKey;            // signer
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("initialize_space");
  const daoId = args.daoId;
  const salt32 = serArray32(args.salt);

  // ix data = disc(8) + dao_id(Pubkey=32) + salt([u8;32]=32)
  const data = Buffer.from(concatBytes(disc, serPubkey(daoId), salt32));

  const [spaceAcct] = deriveSpacePda(daoId);

  return {
    spaceAcct,
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: true },
        { pubkey: args.authority, isSigner: true, isWritable: false },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}

/* =============================================================================
 * buildAttestIdentityIx
 * ============================================================================= */

export function buildAttestIdentityIx(args: {
  daoId: PublicKey;
  platform: VerificationPlatform; // enum
  platformSeed: number;           // must == platform
  idHash: Uint8Array | number[];  // [u8;32]
  expiresAt: bigint;              // i64 (0 = no expiry)
  attestor: PublicKey;            // signer
  payer: PublicKey;               // signer
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  if ((args.platform as number) !== (args.platformSeed & 0xff)) {
    throw new Error("platformSeed must match platform enum discriminant");
  }

  const disc = ixDisc("attest_identity");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);

  // data = disc + dao_id + platform(enum u8) + platform_seed(u8) + id_hash(32) + expires_at(i64)
  const data = Buffer.from(
    concatBytes(
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
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: true }, // init_if_needed
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}

/* =============================================================================
 * buildRevokeIdentityIx
 * ============================================================================= */

export function buildRevokeIdentityIx(args: {
  daoId: PublicKey;
  platform: VerificationPlatform;
  platformSeed: number;
  idHash: Uint8Array | number[]; // [u8;32]
  attestor: PublicKey;           // signer
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  if ((args.platform as number) !== (args.platformSeed & 0xff)) {
    throw new Error("platformSeed must match platform enum discriminant");
  }

  const disc = ixDisc("revoke_identity");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);

  // data = disc + dao_id + platform(enum u8) + platform_seed(u8) + id_hash(32)
  const data = Buffer.from(
    concatBytes(
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
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: true },
      ],
      data,
    }),
  };
}

/* =============================================================================
 * buildLinkWalletIx
 * ============================================================================= */

export function buildLinkWalletIx(args: {
  daoId: PublicKey;
  platformSeed: number;          // used to derive identity PDA
  idHash: Uint8Array | number[]; // used to derive identity PDA
  wallet: PublicKey;             // CHECK account (not signer)
  walletHash: Uint8Array | number[]; // [u8;32] instruction arg + seeds for link PDA
  attestor: PublicKey;           // signer
  payer: PublicKey;              // signer
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("link_wallet");
  const daoId = args.daoId;
  const walletHash32 = serArray32(args.walletHash);
  const idHash32 = serArray32(args.idHash);

  // data = disc + dao_id + platform_seed(u8) + id_hash(32) + wallet_hash(32)
    const data = Buffer.from(
    concatBytes(
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
        { pubkey: args.attestor, isSigner: true, isWritable: false },
        { pubkey: identity, isSigner: false, isWritable: false },
        { pubkey: args.wallet, isSigner: false, isWritable: false }, // CHECK
        { pubkey: link, isSigner: false, isWritable: true },         // init_if_needed
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}

/* =============================================================================
 * buildUnlinkWalletIx
 * ============================================================================= */

export function buildUnlinkWalletIx(args: {
  daoId: PublicKey;
  platformSeed: number;
  idHash: Uint8Array | number[];     // derive identity
  walletHash: Uint8Array | number[]; // derive link
  attestor: PublicKey;               // signer
  recipient: PublicKey;              // writable (close destination)
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("unlink_wallet");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);
  const walletHash32 = serArray32(args.walletHash);

  // data = disc + dao_id
  const data = Buffer.from(concatBytes(disc, serPubkey(daoId)));

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
        { pubkey: link, isSigner: false, isWritable: true },       // close
        { pubkey: args.recipient, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}