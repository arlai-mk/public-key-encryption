import * as amino_1 from "@cosmjs/amino"
import * as crypto_1 from "@cosmjs/crypto"

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"

const defaultOptions = {
    bip39Password: "",
    hdPath: amino_1.makeCosmoshubPath(0),
};

// Return the Private / Public keys pair by taking the mnemonic
export const convertMnemonicToKeyPair = async (mnemonic: string): Promise<{privkey: Uint8Array, pubkey: Uint8Array}> => {
    const mnemonicChecked = new crypto_1.EnglishMnemonic(mnemonic);
    const seed = await crypto_1.Bip39.mnemonicToSeed(mnemonicChecked, defaultOptions.bip39Password);

    const { privkey } = crypto_1.Slip10.derivePath(crypto_1.Slip10Curve.Secp256k1, seed, defaultOptions.hdPath);
    const { pubkey } = await crypto_1.Secp256k1.makeKeypair(privkey);

    return {
        privkey: privkey,
        pubkey: crypto_1.Secp256k1.compressPubkey(pubkey),
    };
}

// This function allows us to check that the result from convertMnemonicToKeyPair is correct.
// With the same mnemonic, it should return the same public key
export const convertMnemonicToPublicKey = async (mnemonic: string): Promise<Uint8Array> => {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic)
    const account = (await wallet.getAccounts())[0]

    return account.pubkey
}

export const convertMnemonicToPrivateKey = async (mnemonic: string): Promise<Uint8Array> => {
    const mnemonicChecked = new crypto_1.EnglishMnemonic(mnemonic);
    const seed = await crypto_1.Bip39.mnemonicToSeed(mnemonicChecked, defaultOptions.bip39Password);

    const { privkey } = crypto_1.Slip10.derivePath(crypto_1.Slip10Curve.Secp256k1, seed, defaultOptions.hdPath);

    return privkey
}