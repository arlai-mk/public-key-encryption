// Use eciesjs library
import { encrypt, decrypt, PrivateKey, PublicKey } from 'eciesjs'
import { bob_mnemonic } from './mnemonics'
import { convertMnemonicToKeyPair, convertMnemonicToPublicKey } from './mnemonics_to_keys'

const runEncryptv1 = async(): Promise<void> => {
    const { privkey, pubkey } = await convertMnemonicToKeyPair(bob_mnemonic)

    const data = Buffer.from('this is a test')

    const pubBob = new PublicKey(Buffer.from(pubkey))
    const encryptedData = encrypt(pubBob.toHex(), data)
    
    const privBob = new PrivateKey(Buffer.from(privkey))
    const decryptedData = decrypt(privBob.toHex(), encryptedData)

    console.log(decryptedData.toString())
}

runEncryptv1()