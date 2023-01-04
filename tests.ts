import * as secp from '@noble/secp256k1';

import { convertMnemonicToPrivateKey } from './mnemonics_to_keys'

import alice from './knowledge_alice.json'
import bob from './knowledge_bob.json'

import { getPublicKeyFromAddress } from './retrieve_pubkeys'

const compareUint8Array = function (array1: Uint8Array, array2: Uint8Array): boolean {
    if (array1.length !== array2.length) {
        return false;
    }

    for (let i = 0; i < array1.length; i++) {
        if ((array1[i] !== array2[i])) {
            return false;
        }
    }

    return true;
}

const compareSharedKey = async (): Promise<boolean> => {
    // I am Alice
    const bob_public_key = await getPublicKeyFromAddress(alice.bob_address)
    const alice_private_key = await convertMnemonicToPrivateKey(alice.my_mnemonic)
    const alice_shared_key = secp.getSharedSecret(alice_private_key, bob_public_key, true)
    
    // I am Bob
    const alice_public_key = await getPublicKeyFromAddress(bob.alice_address)
    const bob_private_key = await convertMnemonicToPrivateKey(bob.my_mnemonic)
    const bob_shared_key = secp.getSharedSecret(bob_private_key, alice_public_key, true)

    // Results
    console.log("Alice sharedKey:", alice_shared_key)
    console.log("Bob sharedKey:", bob_shared_key)

    return compareUint8Array(alice_shared_key, bob_shared_key)
}

const runTests = async(): Promise<void> => {
    const resultCompareSharedKey = await compareSharedKey()
    console.log("Shared keys are equal:", resultCompareSharedKey)
}

runTests()