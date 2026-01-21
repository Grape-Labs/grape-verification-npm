# Grape Verification Registry (Client Helpers)

Client-side helpers for the **Grape Verification Registry** Solana program.

This package provides **hashing utilities, PDA derivation helpers, and read helpers** used by
Discord bots, Telegram bots, and web UIs that integrate with the on-chain verification registry.

> 🔐 **Privacy-first design**
> - No plaintext Discord / Telegram / Twitter / Email IDs stored on-chain
> - No wallet public keys stored in program state
> - All identities and wallets are represented by salted hashes

---

## 📦 Installation

```bash
npm install @grapenpm/grape-verification-registry
```

🧠 What this package does

This package is intentionally small and focused. It helps you:
	•	Derive PDAs exactly the same way as the on-chain program
	•	Compute identity hashes and wallet hashes correctly
	•	Read verification state from chain (spaces, identities, wallet links)

It does not:
	•	Perform OAuth (Discord / Telegram / Twitter)
	•	Manage nonces or signatures
	•	Enforce token-gating rules
	•	Provide UI components

Those belong in your app or bot.


⸻

🏗 Concepts (quick overview)

Space

A per-DAO configuration account.
	•	Holds the DAO ID
	•	Holds a random salt used for hashing
	•	Defines the attestor authority

Identity

A verified platform identity (e.g. a Discord user), stored as a hash.
	•	One identity per (space, platform, id_hash)
	•	Can link to multiple wallets
	•	Can expire or be revoked

Wallet Link

A link between an identity and a wallet hash.
	•	Users can link multiple wallets
	•	Wallet public keys are never stored in account data

⸻

🔑 Constants & Enums

```ts
import {
  PROGRAM_ID,
  VerificationPlatform,
} from "@grapenpm/grape-verification-registry";
```
```ts
VerificationPlatform.Discord   // 0
VerificationPlatform.Telegram  // 1
VerificationPlatform.Twitter   // 2
VerificationPlatform.Email     // 3
```

⸻

🔐 Hashing Helpers

Wallet hash
```ts
import { walletHash } from "@grapenpm/grape-verification-registry";
import { PublicKey } from "@solana/web3.js";

const hash = walletHash(spaceSalt, walletPubkey);
```
Equivalent to on-chain:
```code
sha256( space.salt || "wallet" || wallet_pubkey )
```

⸻

Identity hash
```ts
import { identityHash } from "@grapenpm/grape-verification-registry";

const hash = identityHash(
  spaceSalt,
  "discord",
  discordUserId
);
```
Equivalent to on-chain:
```code
sha256( space.salt || platform_tag || platform_user_id )
```
Supported tags:
	•	discord
	•	telegram
	•	twitter
	•	email

⸻

📍 PDA Helpers

Space PDA
```ts
import { deriveSpacePda } from "@grapenpm/grape-verification-registry";

const [spacePda] = deriveSpacePda(daoPubkey);
```
Seeds:
```code
["space", dao_id]
```

⸻

Identity PDA
```ts
import { deriveIdentityPda } from "@grapenpm/grape-verification-registry";

const [identityPda] = deriveIdentityPda(
  spacePda,
  VerificationPlatform.Discord,
  idHash
);
```
Seeds:
```code
["identity", space, platform_seed, id_hash]
```

⸻

Wallet Link PDA
```ts
import { deriveLinkPda } from "@grapenpm/grape-verification-registry";

const [linkPda] = deriveLinkPda(identityPda, walletHash);
```
Seeds:
```code
["link", identity, wallet_hash]
```

⸻

🔍 Read Helpers

Fetch space
```ts
import { fetchSpace } from "@grapenpm/grape-verification-registry";

const accountInfo = await fetchSpace(connection, spacePda);
```

⸻

Fetch identity
```ts
import { fetchIdentity } from "@grapenpm/grape-verification-registry";

const accountInfo = await fetchIdentity(connection, identityPda);
```

⸻

Fetch all wallets linked to an identity
```ts
import { fetchLinksForIdentity } from "@grapenpm/grape-verification-registry";

const links = await fetchLinksForIdentity(connection, identityPda);
```
🌐 Network notes
	•	This package is network-agnostic
	•	Devnet / Mainnet is determined entirely by:
	•	the Connection you pass
	•	the program ID you use

The default PROGRAM_ID currently points to devnet.

⸻

🧪 Versioning & stability

Current status: ALPHA
	•	APIs may evolve
	•	Hashing and PDA derivations are considered stable
	•	New helpers may be added without breaking changes

⸻

🤝 Intended usage

This package is designed to be used by:
	•	Discord verification bots
	•	Telegram verification bots
	•	Wallet-linking web UIs
	•	Indexers and token-gating services

All of them should derive hashes and PDAs identically, using this package as the source of truth.
