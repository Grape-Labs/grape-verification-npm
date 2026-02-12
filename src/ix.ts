// ix.ts - FIXED VERSION
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";

import {
  COMMUNITY_METADATA_MAX_LEN,
  PROGRAM_ID,
  VerificationPlatform,
} from "./constants.js";
import {
  deriveIdentityPda,
  deriveLinkPda,
  deriveSpaceMetadataPda,
  deriveSpacePda,
} from "./pda.js";

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

function ixDisc(nameSnake: string): Uint8Array {
  return sha256(utf8ToBytes(`global:${nameSnake}`)).slice(0, 8);
}

function serPubkey(pk: PublicKey) {
  return pk.toBytes();
}

function serU8(n: number) {
  return new Uint8Array([u8(n)]);
}

function u32le(n: number) {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) {
    throw new Error("Expected u32 integer");
  }

  const out = new Uint8Array(4);
  out[0] = n & 0xff;
  out[1] = (n >>> 8) & 0xff;
  out[2] = (n >>> 16) & 0xff;
  out[3] = (n >>> 24) & 0xff;
  return out;
}

function serArray32(a: Uint8Array | number[]) {
  const b = a instanceof Uint8Array ? a : Uint8Array.from(a);
  if (b.length !== 32) throw new Error("Expected 32-byte array");
  return b;
}

function serPlatform(platform: VerificationPlatform): Uint8Array {
  return serU8(platform as number);
}

function serOptionString(value: string | null | undefined): Uint8Array {
  if (value == null) return serU8(0);

  const bytes = utf8ToBytes(value);
  if (bytes.length > COMMUNITY_METADATA_MAX_LEN) {
    throw new Error(
      `communityMetadata exceeds ${COMMUNITY_METADATA_MAX_LEN} bytes`
    );
  }

  return concatBytes(serU8(1), u32le(bytes.length), bytes);
}

/* =============================================================================
 * buildInitializeSpaceIx
 * ============================================================================= */

export function buildInitializeSpaceIx(args: {
  daoId: PublicKey;
  salt: Uint8Array | number[];
  authority: PublicKey;
  payer: PublicKey;
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("initialize_space");
  const daoId = args.daoId;
  const salt32 = serArray32(args.salt);

  // ✅ CORRECT: disc(8) + dao_id(32) + salt(32)
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
 * buildSetSpaceCommunityMetadataIx
 * ============================================================================= */

export function buildSetSpaceCommunityMetadataIx(args: {
  daoId: PublicKey;
  authority: PublicKey;
  payer: PublicKey;
  communityMetadata: string | null;
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("set_space_community_metadata");
  const daoId = args.daoId;
  const encodedMetadata = serOptionString(args.communityMetadata);

  const data = Buffer.from(
    concatBytes(disc, serPubkey(daoId), encodedMetadata)
  );

  const [spaceAcct] = deriveSpacePda(daoId);
  const [spaceMetadata] = deriveSpaceMetadataPda(spaceAcct);

  return {
    spaceAcct,
    spaceMetadata,
    ix: new TransactionInstruction({
      programId,
      keys: [
        { pubkey: spaceAcct, isSigner: false, isWritable: false },
        { pubkey: args.authority, isSigner: true, isWritable: false },
        { pubkey: spaceMetadata, isSigner: false, isWritable: true },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}

export function buildClearSpaceCommunityMetadataIx(args: {
  daoId: PublicKey;
  authority: PublicKey;
  payer: PublicKey;
  programId?: PublicKey;
}) {
  return buildSetSpaceCommunityMetadataIx({
    daoId: args.daoId,
    authority: args.authority,
    payer: args.payer,
    communityMetadata: null,
    programId: args.programId ?? PROGRAM_ID,
  });
}

/* =============================================================================
 * buildAttestIdentityIx - FIXED
 * ============================================================================= */

export function buildAttestIdentityIx(args: {
  daoId: PublicKey;
  platform: VerificationPlatform;
  platformSeed: number;
  idHash: Uint8Array | number[];
  expiresAt: bigint;
  attestor: PublicKey;
  payer: PublicKey;
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  if ((args.platform as number) !== (args.platformSeed & 0xff)) {
    throw new Error("platformSeed must match platform enum discriminant");
  }

  const disc = ixDisc("attest_identity");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);

  // ✅ FIXED: disc(8) + dao_id(32) + platform(1) + platform_seed(1) + id_hash(32) + expires_at(8)
  const data = Buffer.from(
    concatBytes(
      disc,                          // 8 bytes
      serPubkey(daoId),              // 32 bytes - THIS WAS MISSING!
      serPlatform(args.platform),    // 1 byte
      serU8(args.platformSeed),      // 1 byte
      idHash32,                      // 32 bytes
      i64le(args.expiresAt)          // 8 bytes
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
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}

/* =============================================================================
 * buildRevokeIdentityIx - FIXED
 * ============================================================================= */

export function buildRevokeIdentityIx(args: {
  daoId: PublicKey;
  platform: VerificationPlatform;
  platformSeed: number;
  idHash: Uint8Array | number[];
  attestor: PublicKey;
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  if ((args.platform as number) !== (args.platformSeed & 0xff)) {
    throw new Error("platformSeed must match platform enum discriminant");
  }

  const disc = ixDisc("revoke_identity");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);

  // ✅ FIXED: disc(8) + dao_id(32) + platform(1) + platform_seed(1) + id_hash(32)
  const data = Buffer.from(
    concatBytes(
      disc,                       // 8 bytes
      serPubkey(daoId),          // 32 bytes - THIS WAS MISSING!
      serPlatform(args.platform), // 1 byte
      serU8(args.platformSeed),   // 1 byte
      idHash32                    // 32 bytes
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
 * buildLinkWalletIx - FIXED
 * ============================================================================= */

export function buildLinkWalletIx(args: {
  daoId: PublicKey;
  platformSeed: number;
  idHash: Uint8Array | number[];
  wallet: PublicKey;
  walletHash: Uint8Array | number[];
  attestor: PublicKey;
  payer: PublicKey;
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("link_wallet");
  const daoId = args.daoId;
  const walletHash32 = serArray32(args.walletHash);
  const idHash32 = serArray32(args.idHash);

  // ✅ FIXED: disc(8) + dao_id(32) + platform_seed(1) + id_hash(32) + wallet_hash(32)
  const data = Buffer.from(
    concatBytes(
      disc,                  // 8 bytes
      serPubkey(daoId),     // 32 bytes - THIS WAS MISSING!
      serU8(args.platformSeed), // 1 byte
      idHash32,             // 32 bytes
      walletHash32          // 32 bytes
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
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}

export function buildLinkWalletSelfIx(args: {
  daoId: PublicKey;
  platformSeed: number;
  idHash: Uint8Array | number[];
  wallet: PublicKey;              // must be signer on the tx
  walletHash: Uint8Array | number[];
  payer: PublicKey;
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("link_wallet_self");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);
  const walletHash32 = serArray32(args.walletHash);

  // same layout as link_wallet: disc + dao_id + platform_seed + id_hash + wallet_hash
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
        { pubkey: identity, isSigner: false, isWritable: false },
        { pubkey: args.wallet, isSigner: true, isWritable: false },  // ✅ signer
        { pubkey: link, isSigner: false, isWritable: true },
        { pubkey: args.payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}

/* =============================================================================
 * buildUnlinkWalletIx - FIXED
 * ============================================================================= */

export function buildUnlinkWalletIx(args: {
  daoId: PublicKey;
  platformSeed: number;
  idHash: Uint8Array | number[];
  walletHash: Uint8Array | number[];
  attestor: PublicKey;
  recipient: PublicKey;
  programId?: PublicKey;
}) {
  const programId = args.programId ?? PROGRAM_ID;

  const disc = ixDisc("unlink_wallet");
  const daoId = args.daoId;
  const idHash32 = serArray32(args.idHash);
  const walletHash32 = serArray32(args.walletHash);

  // ✅ FIXED: disc(8) + dao_id(32) + platform_seed(1) + id_hash(32) + wallet_hash(32)
  const data = Buffer.from(
    concatBytes(
      disc,                  // 8 bytes
      serPubkey(daoId),     // 32 bytes - THIS WAS MISSING!
      serU8(args.platformSeed), // 1 byte
      idHash32,             // 32 bytes
      walletHash32          // 32 bytes
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
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    }),
  };
}
