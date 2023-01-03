import { StargateClient } from "@cosmjs/stargate"
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx"

import * as secp from '@noble/secp256k1';
import * as hkdf from "futoin-hkdf"

// File aes.ts is a complete copy of micro-aes-gcm/index.ts file, as I cannot make it work with the normal import
import * as aes from './aes';

import { convertMnemonicToPrivateKey } from './mnemonics_to_keys'

import config from './config.json'

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

const getPublicKeyFromOutboundTx = async (address: string): Promise<Uint8Array> => {
    const client = await StargateClient.connect(config.rpc)

    let txs = await client.searchTx({ sentFromOrTo: address })
    if (txs.length === 0) {
        // Cannot continue: no past transaction from Bob
        return new Uint8Array();
    }

    // The StargateClient.searchTx() function returns the txs sent by the address first
    // so we just need to check the first tx returned. 
    // However, it would be better if we could just search for txs with filter /cosmos/tx/v1beta1/txs?events=message.sender=%27{addr}%27
    let tx = txs[0]

    const decodedTx: Tx = Tx.decode(tx.tx)

    // Need to make sure the tx is signed by "address"
    // We assume it's a single message transaction with type MsgSend
    if (decodedTx.body.messages[0].typeUrl !== '/cosmos.bank.v1beta1.MsgSend') {
        return new Uint8Array();
    }

    const sendMessage: MsgSend = MsgSend.decode(decodedTx.body!.messages[0].value)

    // We also assume that the "fromAddress" of the MsgSend is the same as the signer, as we will get the public key of the signer
    if (sendMessage.fromAddress !== address) {
        return new Uint8Array();
    }

    // Not sure why, but it seems that there are 2 items at the beginning of the Uint8Array that are not really part of the public key
    return decodedTx.authInfo.signerInfos[0].publicKey.value.slice(2)
}

// This function should be better than the getPublicKeyFromOutboundTx
const getPublicKeyFromAccount = async (address: string): Promise<Uint8Array> => {
    const client = await StargateClient.connect(config.rpc)

    let account = await client.getAccount(address)

    // The account has not yet been initialised (no transaction yet?)
    if (!account.pubkey) {
        return new Uint8Array()
    }

    return Uint8Array.from(Buffer.from(account.pubkey.value, "base64"))
}

const runEncryptv3 = async(): Promise<void> => {
    const message_to_send = "this is a test"

    // Alice encrypts using her private key + Bob's public key
    const bob_public_key = await getPublicKeyFromAccount(alice.bob_address)
    const encrypted_msg = await doEncrypt(alice.my_mnemonic, bob_public_key, message_to_send)

    // Bob decrypts using his private key + Alice's public key
    const alice_public_key = await getPublicKeyFromAccount(bob.alice_address)
    const decrypted_msg = await doDecrypt(bob.my_mnemonic, alice_public_key, encrypted_msg)

    console.log(decrypted_msg === message_to_send ? "SUCCESS: " : "ERROR", decrypted_msg)
}

runEncryptv3()