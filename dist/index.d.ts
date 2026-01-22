import * as _solana_web3_js from '@solana/web3.js';
import { PublicKey, Connection, TransactionInstruction } from '@solana/web3.js';
import * as buffer from 'buffer';

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

export { PROGRAM_ID, TAG_DISCORD, TAG_EMAIL, TAG_TELEGRAM, TAG_TWITTER, TAG_WALLET, VerificationPlatform, buildAttestIdentityIx, buildInitializeSpaceIx, buildLinkWalletIx, buildRevokeIdentityIx, buildUnlinkWalletIx, deriveIdentityPda, deriveLinkPda, deriveSpacePda, fetchIdentity, fetchLinksForIdentity, fetchSpace, identityHash, walletHash };
