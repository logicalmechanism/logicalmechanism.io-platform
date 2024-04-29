import { useState, useEffect, useCallback } from "react";
import type { NextPage } from "next";
import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import { MaestroProvider } from '@meshsdk/core';
import type { UTxO } from '@meshsdk/core';
import { scriptHashToBech32 } from '@meshsdk/mesh-csl';
import AssetGrid from '../components/AssetGrid'; // Adjust the path as necessary

const Home: NextPage = () => {
  const { connected, wallet } = useWallet();
  const [utxo, setUTxO] = useState<UTxO | null>(null);
  const [network, setNetwork] = useState<null | number>(null);
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scriptAddress, setScriptAddress] = useState<string | null>(null);

  async function findScriptUTxO({ scriptAddress, network }: { scriptAddress: string, network: number }) {
    // preprod or mainnet
    const networkName = network === 0 ? 'Preprod' : 'Mainnet';
    const maestro = new MaestroProvider({ network: networkName, apiKey: process.env.NEXT_PUBLIC_MAESTRO!, turboSubmit: false });
    const utxos = await maestro.fetchAddressUTxOs(scriptAddress);
    console.log('Script UTxOs: ', utxos);
    // this is the condition where a new utxo must be created in the contract
    if (utxos.length === 0) return null;
    // find the utxo with the least amount of tokens on it
    // assume the first utxo is the smallest then loop all utxos
    let inputToBeSpent = utxos[0]
    let smallest = utxos[0].output.amount.length
    utxos.forEach(utxo => {
      // if something has less assets then use that
      if (utxo.output.amount.length < smallest) {
        smallest = utxo.output.amount.length
        inputToBeSpent = utxo
      }
    });
    return inputToBeSpent
  }

  // Wrap getNetworkId in useCallback
  const getNetworkId = useCallback(async () => {
    if (wallet) {
      const _network = await wallet.getNetworkId();
      setNetwork(_network);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
    }
  }, [wallet]); // Add `wallet` to the dependency array because getNetworkId depends on it


  // useEffect hook to run getNetworkId when the connected state changes to true
  useEffect(() => {
    if (connected) {
      getNetworkId();
    }
  }, [connected, getNetworkId]); // This tells React to run the effect again if the `connected` value changes

  // Resolve script address whenever the network ID changes and is not null
  useEffect(() => {
    // this would need to be from a db
    const scriptHash = "0049d04cc313681a8390d5ed0484b6803c76d80cd97e71df8e4e5f3a";
    const stakeHash = "bfaa385c8eab7bbdc6c98b50413435b3d02b73de3c644e1384b801d4";
    // if the network is set then get the script utxo and address
    if (network !== null) {
      setLoading(true);
      const resolvedAddress = scriptHashToBech32(scriptHash, stakeHash, network);
      findScriptUTxO({ scriptAddress: resolvedAddress, network: network }).then((resolvedUTxO) => {
        setUTxO(resolvedUTxO)
        setScriptAddress(resolvedAddress);
        setLoading(false);
      });
    }
  }, [network]); // Depend on the `network` state


  return (
    <div>
      <h1>Connect Wallet</h1>
      <CardanoWallet />
      {loading ? (
        <div>Loading...</div>
      ) : connected && assets && utxo && scriptAddress ? (
        <div>
          <h2>Contract Address: {scriptAddress}</h2>
          <h2>Script UTxO: {utxo?.input.txHash}#{utxo?.input.outputIndex}</h2>
          <AssetGrid items={assets} wallet={wallet} scriptUTxO={utxo} scriptAddress={scriptAddress} network={network} />
        </div>
      ) : null}
    </div>
  );


};

export default Home;