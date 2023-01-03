import { StargateClient, SigningStargateClient } from "@cosmjs/stargate"
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"

import alice from './knowledge_alice.json'
import config from './config.json'

const getAliceSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1HdWallet.fromMnemonic(alice.my_mnemonic, {
        prefix: "cosmos",
    })
}

const runSendToBob = async(): Promise<void> => {
    const client = await StargateClient.connect(config.rpc)

    const aliceSigner: OfflineDirectSigner = await getAliceSignerFromMnemonic()
    const alice_address = (await aliceSigner.getAccounts())[0].address

    const signingClient = await SigningStargateClient.connectWithSigner(config.rpc, aliceSigner)

    console.log("Bob balance before:", await signingClient.getAllBalances(alice.bob_address))
    console.log("Alice balance before:", await client.getAllBalances(alice_address))

    // Alice sends back 0.5 $ATOM to Bob
    const result = await signingClient.sendTokens(
        alice_address,
        alice.bob_address,
        [{ denom: "uatom", amount: "500000" }],
        {
            amount: [{ denom: "uatom", amount: "500" }],
            gas: "200000",
        },
        "thank you!"
    )

    // Output the result of the Tx
    console.log("Transfer result:", result)

    console.log("Bob balance after:", await client.getAllBalances(alice.bob_address))
    console.log("Alice balance after:", await client.getAllBalances(alice_address))
}

runSendToBob()