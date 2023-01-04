import { StargateClient } from "@cosmjs/stargate"
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx"

import config from './config.json'

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

export const getPublicKeyFromAddress = async (address: string): Promise<Uint8Array> => {
    switch (config.func_retrieve_pubkey) {
        case "getPublicKeyFromAccount":
            return getPublicKeyFromAccount(address)
        case "getPublicKeyFromOutboundTx":
            return getPublicKeyFromOutboundTx(address)
        default:
            return new Uint8Array()
    }
}