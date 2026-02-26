import { PinataSDK } from "pinata-web3";

function getPinata(): PinataSDK {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT is not set");
  }

  return new PinataSDK({ pinataJwt: jwt });
}

export async function pinToIPFS(
  data: Buffer,
  filename: string
): Promise<string> {
  const pinata = getPinata();

  const file = new File([data], filename, {
    type: filename.endsWith(".json") ? "application/json" : "image/png",
  });

  const result = await pinata.upload.file(file);
  return result.IpfsHash;
}
