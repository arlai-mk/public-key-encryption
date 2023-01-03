import { StargateClient, SigningStargateClient } from "@cosmjs/stargate"
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"

import bob from './knowledge_bob.json'
import config from './config.json'

const getBobSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1HdWallet.fromMnemonic(bob.my_mnemonic, {
        prefix: "cosmos",
    })
}

const runSendToAlice = async(): Promise<void> => {

    const client = await StargateClient.connect(config.rpc)

    const bobSigner: OfflineDirectSigner = await getBobSignerFromMnemonic()
    const bob_address = (await bobSigner.getAccounts())[0].address

    const signingClient = await SigningStargateClient.connectWithSigner(config.rpc, bobSigner)

    console.log("Alice balance before:", await signingClient.getAllBalances(bob.alice_address))
    console.log("Bob balance before:", await client.getAllBalances(bob_address))

    // Bob sends 1 $ATOM to Alice
    const result = await signingClient.sendTokens(
        bob_address,
        bob.alice_address,
        [{ denom: "uatom", amount: "1000000" }],
        {
            amount: [{ denom: "uatom", amount: "500" }],
            gas: "200000",
        },
        "here you go!"
    )

    // Output the result of the Tx
    console.log("Transfer result:", result)

    console.log("Alice balance after:", await client.getAllBalances(bob.alice_address))
    console.log("Bob balance after:", await client.getAllBalances(bob_address))

}

runSendToAlice()