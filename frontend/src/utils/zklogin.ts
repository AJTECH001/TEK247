import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const REDIRECT_URL = import.meta.env.VITE_REDIRECT_URL || 'http://localhost:5173/auth/zklogin/callback';

export const suiClient = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });

export const zkLoginUtils = {
  async prepareLogin() {
    const { epoch } = await suiClient.getLatestSuiSystemState();
    const maxEpoch = Number(epoch) + 2;
    
    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
    
    // Store in session storage for the callback
    sessionStorage.setItem('zklogin_ephemeral_private_key', ephemeralKeyPair.getSecretKey());
    sessionStorage.setItem('zklogin_randomness', randomness);
    sessionStorage.setItem('zklogin_max_epoch', maxEpoch.toString());
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URL,
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce: nonce,
    });
    
    const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = loginUrl;
  },
  
  getStoredData() {
    return {
      ephemeralPrivateKey: sessionStorage.getItem('zklogin_ephemeral_private_key'),
      randomness: sessionStorage.getItem('zklogin_randomness'),
      maxEpoch: sessionStorage.getItem('zklogin_max_epoch'),
    };
  },
  
  clearStoredData() {
    sessionStorage.removeItem('zklogin_ephemeral_private_key');
    sessionStorage.removeItem('zklogin_randomness');
    sessionStorage.removeItem('zklogin_max_epoch');
  }
};
