// use the Millr noble-secp256k1

import * as secp from '@noble/secp256k1';
import * as hkdf from "futoin-hkdf"

// File aes.ts is a complete copy of micro-aes-gcm/index.ts file, as I cannot make it work with the normal import
import * as aes from './aes';

import { convertMnemonicToKeyPair } from './mnemonics_to_keys'
import { alice_mnemonic, bob_mnemonic } from './mnemonics'

const runEncryptv2 = async(): Promise<void> => {
    const alice = await convertMnemonicToKeyPair(alice_mnemonic)
    const bob = await convertMnemonicToKeyPair(bob_mnemonic)
    const data = Buffer.from('this is a test')

    // Alice wants to send an encrypted message to Bob, need her own Private key and Bob's Public key
    const sharedKeyForAlice = secp.getSharedSecret(alice.privkey, bob.pubkey, true)
    const derivedSharedKeyForAlice = hkdf.default(Buffer.from(sharedKeyForAlice), 32, { hash: 'SHA-256' })

    // Uses a random IV (12 bits)
    const encryptedData = await aes.encrypt(derivedSharedKeyForAlice, data)

    // Bob wants to decrypt, need his own Private key and Alice's Public key
    const sharedKeyForBob = secp.getSharedSecret(bob.privkey, alice.pubkey, true)
    const derivedSharedKeyForBob = hkdf.default(Buffer.from(sharedKeyForBob), 32, { hash: 'SHA-256' })

    const decryptedData = await aes.decrypt(derivedSharedKeyForBob, encryptedData)

    console.log(Buffer.from(decryptedData).toString())
}

runEncryptv2()