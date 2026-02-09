import * as _solana_web3_js from '@solana/web3.js';
import { PublicKey, Connection, TransactionInstruction } from '@solana/web3.js';
import * as buffer from 'buffer';
import { Buffer } from 'buffer';

declare const PROGRAM_ID: PublicKey;
declare enum VerificationPlatform {
    Discord = 0,
    Telegram = 1,
    Twitter = 2,
    Email = 3
}
declare const TAG_WALLET = "wallet";
declare const TAG_DISCORD = "discord";
declare const TAG_TELEGRAM = "telegram";
declare const TAG_TWITTER = "twitter";
declare const TAG_EMAIL = "email";

/**
 * sha256( salt || "wallet" || wallet_pubkey )
 */
declare function walletHash(spaceSalt: Uint8Array, wallet: PublicKey): Uint8Array;
/**
 * sha256( salt || platformTag || platformUserId )
 */
declare function identityHash(spaceSalt: Uint8Array, platformTag: string, platformUserId: string | Uint8Array): Uint8Array;

/**
 * Space PDA
 * seeds = ["space", daoId]
 */
declare function deriveSpacePda(daoId: PublicKey): [PublicKey, number];
/**
 * Identity PDA
 * seeds = ["identity", space, platform_seed, id_hash]
 */
declare function deriveIdentityPda(space: PublicKey, platformSeed: number, idHash: Uint8Array): [PublicKey, number];
/**
 * Link PDA
 * seeds = ["link", identity, wallet_hash]
 */
declare function deriveLinkPda(identity: PublicKey, walletHash: Uint8Array): [PublicKey, number];

declare function fetchSpace(connection: Connection, space: PublicKey): Promise<_solana_web3_js.AccountInfo<buffer.Buffer> | null>;
declare function fetchIdentity(connection: Connection, identity: PublicKey): Promise<_solana_web3_js.AccountInfo<buffer.Buffer> | null>;
declare function fetchLinksForIdentity(connection: Connection, identity: PublicKey): Promise<_solana_web3_js.GetProgramAccountsResponse>;

/**
 * Parse a Link account's data buffer.
 *
 * Layout (88 bytes total):
 *   [0..8]   discriminator
 *   [8]      version (u8)
 *   [9..41]  identity (Pubkey, 32 bytes)
 *   [41..73] wallet_hash ([u8; 32])
 *   [73..81] linked_at (i64 LE)
 *   [81]     bump (u8)
 *   [82..88] _padding ([u8; 6])
 */
interface ParsedLink {
    version: number;
    identity: PublicKey;
    walletHash: Uint8Array;
    linkedAt: number;
    bump: number;
}
declare function parseLink(data: Buffer): ParsedLink;
/**
 * Linked wallet with metadata
 */
interface LinkedWallet {
    /** The Link PDA public key */
    pubkey: PublicKey;
    /** Raw wallet hash bytes (32 bytes) */
    walletHashBytes: Uint8Array;
    /** Wallet hash as hex string */
    walletHashHex: string;
    /** Unix timestamp when linked (seconds) */
    linkedAt: number;
    /** Identity PDA this wallet is linked to */
    identity: PublicKey;
    /** True if this wallet hash matches the current wallet */
    isCurrentWallet: boolean;
}
/**
 * Fetch all Link accounts for a given Identity PDA.
 *
 * @param connection - Solana RPC connection
 * @param identityPda - The Identity PDA to query links for
 * @param currentWalletHash - Optional: current wallet's hash (32 bytes) to mark as "current"
 * @param programId - Optional: custom program ID (defaults to PROGRAM_ID)
 * @returns Array of LinkedWallet objects, sorted by linkedAt (oldest first)
 */
declare function fetchLinkedWallets(connection: Connection, identityPda: PublicKey, currentWalletHash?: Uint8Array | null, programId?: PublicKey): Promise<LinkedWallet[]>;
/**
 * Fetch a single Link account by PDA
 */
declare function fetchLink(connection: Connection, linkPda: PublicKey): Promise<ParsedLink | null>;

declare function buildInitializeSpaceIx(args: {
    daoId: PublicKey;
    salt: Uint8Array | number[];
    authority: PublicKey;
    payer: PublicKey;
    programId?: PublicKey;
}): {
    spaceAcct: PublicKey;
    ix: TransactionInstruction;
};
declare function buildAttestIdentityIx(args: {
    daoId: PublicKey;
    platform: VerificationPlatform;
    platformSeed: number;
    idHash: Uint8Array | number[];
    expiresAt: bigint;
    attestor: PublicKey;
    payer: PublicKey;
    programId?: PublicKey;
}): {
    spaceAcct: PublicKey;
    identity: PublicKey;
    ix: TransactionInstruction;
};
declare function buildRevokeIdentityIx(args: {
    daoId: PublicKey;
    platform: VerificationPlatform;
    platformSeed: number;
    idHash: Uint8Array | number[];
    attestor: PublicKey;
    programId?: PublicKey;
}): {
    spaceAcct: PublicKey;
    identity: PublicKey;
    ix: TransactionInstruction;
};
declare function buildLinkWalletIx(args: {
    daoId: PublicKey;
    platformSeed: number;
    idHash: Uint8Array | number[];
    wallet: PublicKey;
    walletHash: Uint8Array | number[];
    attestor: PublicKey;
    payer: PublicKey;
    programId?: PublicKey;
}): {
    spaceAcct: PublicKey;
    identity: PublicKey;
    link: PublicKey;
    ix: TransactionInstruction;
};
declare function buildLinkWalletSelfIx(args: {
    daoId: PublicKey;
    platformSeed: number;
    idHash: Uint8Array | number[];
    wallet: PublicKey;
    walletHash: Uint8Array | number[];
    payer: PublicKey;
    programId?: PublicKey;
}): {
    spaceAcct: PublicKey;
    identity: PublicKey;
    link: PublicKey;
    ix: TransactionInstruction;
};
declare function buildUnlinkWalletIx(args: {
    daoId: PublicKey;
    platformSeed: number;
    idHash: Uint8Array | number[];
    walletHash: Uint8Array | number[];
    attestor: PublicKey;
    recipient: PublicKey;
    programId?: PublicKey;
}): {
    spaceAcct: PublicKey;
    identity: PublicKey;
    link: PublicKey;
    ix: TransactionInstruction;
};

export { type LinkedWallet, PROGRAM_ID, type ParsedLink, TAG_DISCORD, TAG_EMAIL, TAG_TELEGRAM, TAG_TWITTER, TAG_WALLET, VerificationPlatform, buildAttestIdentityIx, buildInitializeSpaceIx, buildLinkWalletIx, buildLinkWalletSelfIx, buildRevokeIdentityIx, buildUnlinkWalletIx, deriveIdentityPda, deriveLinkPda, deriveSpacePda, fetchIdentity, fetchLink, fetchLinkedWallets, fetchLinksForIdentity, fetchSpace, identityHash, parseLink, walletHash };
