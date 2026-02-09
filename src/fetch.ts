// fetch.ts - Query helpers for grape-verification-registry
import { Connection, PublicKey } from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";
import { PROGRAM_ID } from "./constants.js";
import { Buffer } from "buffer";

/**
 * Compute the discriminator for a given account name.
 * Anchor uses: sha256("account:{AccountName}")[0..8]
 */
function accountDiscriminator(name: string): Uint8Array {
  return sha256(utf8ToBytes(`account:${name}`)).slice(0, 8);
}

// Link account discriminator
const LINK_ACCOUNT_DISC = accountDiscriminator("GrapeVerificationLink");

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
export interface ParsedLink {
  version: number;
  identity: PublicKey;
  walletHash: Uint8Array;
  linkedAt: number;
  bump: number;
}

export function parseLink(data: Buffer): ParsedLink {
  if (data.length < 88) {
    throw new Error(`Link account data too short: ${data.length} bytes`);
  }

  // ✅ Use ! to assert the value exists (we checked length above)
  const version = data[8]!;
  const identity = new PublicKey(data.slice(9, 41));
  const walletHash = data.slice(41, 73);
  const linkedAtBigInt = data.readBigInt64LE(73);
  const bump = data[81]!;

  return {
    version,
    identity,
    walletHash,
    linkedAt: Number(linkedAtBigInt),
    bump,
  };
}

/**
 * Linked wallet with metadata
 */
export interface LinkedWallet {
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
export async function fetchLinkedWallets(
  connection: Connection,
  identityPda: PublicKey,
  currentWalletHash?: Uint8Array | null,
  programId: PublicKey = PROGRAM_ID
): Promise<LinkedWallet[]> {
  try {
    // Convert discriminator to base64 for memcmp filter
    const discBase64 = Buffer.from(LINK_ACCOUNT_DISC).toString("base64");

    // Query all Link accounts where identity field (offset 9) matches identityPda
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: discBase64,
            encoding: "base64",
          },
        },
        {
          memcmp: {
            offset: 9,
            bytes: identityPda.toBase58(), // base58 is default for pubkeys
          },
        },
      ],
    });

    const currentHex = currentWalletHash
      ? bytesToHex(currentWalletHash)
      : null;

    // Parse and map to LinkedWallet objects
    const wallets: LinkedWallet[] = accounts.map((account) => {
      const parsed = parseLink(account.account.data);
      const whHex = bytesToHex(parsed.walletHash);

      return {
        pubkey: account.pubkey,
        walletHashBytes: parsed.walletHash,
        walletHashHex: whHex,
        linkedAt: parsed.linkedAt,
        identity: parsed.identity,
        isCurrentWallet: currentHex !== null && whHex === currentHex,
      };
    });

    // Sort by linkedAt (oldest first)
    return wallets.sort((a, b) => a.linkedAt - b.linkedAt);
  } catch (error) {
    console.error("fetchLinkedWallets error:", error);
    return [];
  }
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fetch a single Link account by PDA
 */
export async function fetchLink(
  connection: Connection,
  linkPda: PublicKey
): Promise<ParsedLink | null> {
  try {
    const accountInfo = await connection.getAccountInfo(linkPda);
    if (!accountInfo) return null;

    return parseLink(accountInfo.data);
  } catch (error) {
    console.error("fetchLink error:", error);
    return null;
  }
}