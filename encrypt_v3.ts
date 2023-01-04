import * as secp from '@noble/secp256k1';
import * as hkdf from "futoin-hkdf"

// File aes.ts is a complete copy of micro-aes-gcm/index.ts file, as I cannot make it work with the normal import
import * as aes from './aes';

import { convertMnemonicToPrivateKey } from './mnemonics_to_keys'
import { getPublicKeyFromAddress } from './retrieve_pubkeys'

import alice from './knowledge_alice.json'
import bob from './knowledge_bob.json'

const doEncrypt = async(my_mnemonic: string, counterparty_pubkey: Uint8Array, cleartext_msg: string): Promise<Uint8Array> => {
    const privkey = await convertMnemonicToPrivateKey(my_mnemonic)

    const sharedKey = secp.getSharedSecret(privkey, counterparty_pubkey, true)
    const derivedSharedKey = hkdf.default(Buffer.from(sharedKey), 32, { hash: 'SHA-256' })

    // This function uses a random IV (12 bits)
    const encryptedData = await aes.encrypt(derivedSharedKey, cleartext_msg)

    return encryptedData
}

const doDecrypt = async(my_mnemonic: string, counterparty_pubkey: Uint8Array, encrypted_msg: Uint8Array): Promise<string> => {
    const privkey = await convertMnemonicToPrivateKey(my_mnemonic)

    const sharedKey = secp.getSharedSecret(privkey, counterparty_pubkey, true)
    const derivedSharedKey = hkdf.default(Buffer.from(sharedKey), 32, { hash: 'SHA-256' })

    const decryptedData = await aes.decrypt(derivedSharedKey, encrypted_msg)

    return Buffer.from(decryptedData).toString()
}

const runEncryptv3 = async(): Promise<void> => {
    const message_to_send = "this is a test"

    // Alice encrypts using her private key + Bob's public key
    const bob_public_key = await getPublicKeyFromAddress(alice.bob_address)
    const encrypted_msg = await doEncrypt(alice.my_mnemonic, bob_public_key, message_to_send)

    // Bob decrypts using his private key + Alice's public key
    const alice_public_key = await getPublicKeyFromAddress(bob.alice_address)
    const decrypted_msg = await doDecrypt(bob.my_mnemonic, alice_public_key, encrypted_msg)

    console.log(decrypted_msg === message_to_send ? "SUCCESS: " : "ERROR", decrypted_msg)
}

runEncryptv3()