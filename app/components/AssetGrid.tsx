import React, { useState } from 'react';
import type { BrowserWallet } from '@meshsdk/core';
import { keepRelevant } from '@meshsdk/core';
import { MeshTxBuilder, } from "@meshsdk/core";
import type { UTxO, Asset } from "@meshsdk/core";
import { MaestroProvider } from '@meshsdk/core';
import type { Unit, Quantity } from '@meshsdk/core';
import SuccessModal from './SuccessModal';
import Notification from './Notification';

interface Item {
  unit: string;
  policyId: string;
  assetName: string;
  fingerprint: string;
  quantity: string;
}

interface AssetGridProps {
  items: Item[];
  wallet: BrowserWallet;
  scriptUTxO: UTxO | null;
  scriptAddress: string | null;
  network: number | null;
}

interface Field {
  bytes?: string;
  int?: bigint;
}

interface RedeemerItem {
  constructor: number;
  fields: Field[];
}

interface Redeemer {
  list: RedeemerItem[];
}

const AssetGrid: React.FC<AssetGridProps> = ({ items, wallet, scriptUTxO, scriptAddress, network }) => {
  // Update state to hold full item objects
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedTxHash, setSubmittedTxHash] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notification, setNotification] = useState<string>('');


  // Toggles item in or out of the selectedItems array based on its presence
  const toggleItem = (item: Item) => {
    const index = selectedItems.findIndex(selectedItem => selectedItem.fingerprint === item.fingerprint);
    if (index >= 0) {
      // Item is already selected, remove it
      setSelectedItems(selectedItems.filter(selectedItem => selectedItem.fingerprint !== item.fingerprint));
    } else {
      // Item is not selected, add it
      setSelectedItems([...selectedItems, item]);
    }
  };

  function getAssetName(unit: string, policyId: string): string {
    // Replace the first occurrence of policyId in unit with an empty string
    return unit.replace(policyId, "");
  }

  const handleModalClose = () => {
    window.location.reload();
    setShowSuccessModal(false);
  };

  // Function to clear notification
  const clearNotification = () => setNotification('');

  async function handleAction() {
    setIsLoading(true); // Start loading
    console.log('Selected Items: ', selectedItems);
    if (selectedItems.length === 0) {
      setNotification('Nothing is Selected');
      setIsLoading(false); // Stop loading
      return;
    }
    console.log('Script UTxO: ', scriptUTxO);
    console.log('Wallet: ', wallet);
    const utxos = await wallet.getUtxos();

    // find the required utxos
    let redeemer: Redeemer = {
      list: []
    };

    let assets: Asset[] = [];

    // add in whatever is already on the utxo minus the lovelace
    scriptUTxO?.output.amount.forEach(item => {
      if (item.unit !== 'lovelace') {
        let thisAsset = {
          unit: item.unit,
          quantity: item.quantity,
        };
        assets.push(thisAsset);
      }
    });

    const assetMap = new Map<Unit, Quantity>();
    selectedItems.forEach(item => {
      // build the redeemer out of the selected items
      const assetName = getAssetName(item.unit, item.policyId)
      redeemer.list.push(
        {
          "constructor": 0,
          "fields": [
            {
              "bytes": item.policyId
            },
            {
              "bytes": assetName
            },
            {
              "int": BigInt(item.quantity)
            }
          ]
        }
      );
      // build the list of assets going to the contract
      // this needs to account for what is on the script already
      let thisAsset = {
        unit: item.unit,
        quantity: item.quantity,
      };
      assets.push(thisAsset);
      // build the map for doing the utxo selection
      assetMap.set(
        item.unit,
        item.quantity
      );
    });
    // set this to 1 ada so it has to grab more ada
    assetMap.set(
      'lovelace',
      '1000000'
    );

    console.log('Redeemer: ', redeemer);
    // keepRelevant should account for 
    const selectedUtxos = keepRelevant(assetMap, utxos);
    console.log('Wallet UTxOs: ', selectedUtxos)
    // this is where the actual sc interaction will be
    const networkName = network === 0 ? 'Preprod' : 'Mainnet';
    const maestro = new MaestroProvider({ network: networkName, apiKey: process.env.NEXT_PUBLIC_MAESTRO!, turboSubmit: false });
    const mesh = new MeshTxBuilder({
      fetcher: maestro,
      submitter: maestro,
      evaluator: maestro,
    });

    // I imagine this stuff should have already been known when we checked 
    // the network id but it can be here for now
    const changeAddress = await wallet.getChangeAddress();
    console.log('Change Address: ', changeAddress);
    const collateralUTxOs = await wallet.getCollateral();
    console.log('Collateral: ', collateralUTxOs);
    if (collateralUTxOs.length === 0) {
      console.error('Collateral Not Set');
      setNotification("Collateral Not Set!");
      // set isLoading to false when 
      setIsLoading(false);
      return;
    }

    // do all the script stuff first
    mesh
      .changeAddress(changeAddress)
      .txInCollateral(collateralUTxOs[0].input.txHash, collateralUTxOs[0].input.outputIndex)
      .spendingPlutusScriptV2()
      .txIn(scriptUTxO?.input.txHash!, scriptUTxO?.input.outputIndex!)
      .txInInlineDatumPresent()
      .txInRedeemerValue(redeemer, undefined, 'JSON')
      .spendingTxInReference('851ee912ba5f0d55bc37937357a2c6d780dc45c39cdedbc8e5cdf95eb981bc40', 1) // this needs to come from a db
      .txOut(scriptAddress!, assets)
      .txOutInlineDatumValue({
        "constructor": 0,
        "fields": []
      }, "JSON");

    // add in the wallet utxos
    selectedUtxos.forEach(item => {
      mesh.txIn(item.input.txHash, item.input.outputIndex)
    });

    // build the tx, sign it, and submit it
    //
    // welcome to call back hell bitch, wahahahah
    //
    mesh.complete().then(() => {
      // so at this point each step is a chain of logic
      // complete teh signing process
      const unsignedTx = mesh.completeSigning();
      console.log('Unsigned Tx: ', unsignedTx);

      // prompt wallet to sign it
      wallet.signTx(unsignedTx, true).then((signedTx) => {
        console.log('Signed Tx: ', signedTx);

        // if there was a good sig on the tx then submit teh tx
        wallet.submitTx(signedTx).then((txHash) => {
          console.log('Tx Hash: ', txHash);
          // if the signed tx can be submitted then show the success modal

          // trigger the success modal pop up here
          setSubmittedTxHash(txHash);
          setShowSuccessModal(true);
          setIsLoading(false);

        }).catch((error) => { // catch a submission error
          console.error('Transaction Submission Error: ', error);
          setNotification('Transaction Submission Error');
          setIsLoading(false);
        });

      }).catch((error) => { // catch a signing error
        console.error('Transaction Sign Error: ', error);
        setNotification('Transaction Sign Error');
        setIsLoading(false);
      });
    }).catch((error) => {
      console.error('Maestro Error: ', error);
      setNotification("Maestro Error!");
      setIsLoading(false);
    });


  };

  // this is the list of known spam policy ids
  // this needs to be from the db
  const knownPolicyIds = [
    // '5d0fb0e8f72b3485ff2b8ff782f29a53094bca6787ff7794b2b26945',
    // '4d6d1192d39a48f4c80edbe52a5c480bec0a4e0711a998ca016b81a5',
    // '2763ad760f52366a9bcd1de64ad4abb274fd50650fc64d6c716ea35e',
    '57ef3a785f363d81f93d695d3f48482a7448666386396b5e90c292d3',
    // '51e752caf66efe993fe55b226b0b737fbcdf512259620f392dc54f66'
  ];

  // Filter items to include only those with policyId in the knownPolicyIds list
  const filteredItems = items.filter(item => knownPolicyIds.includes(item.policyId));

  return (
    <div>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4'>
        {filteredItems.map((item) => (
          <button
            key={item.fingerprint}
            disabled={isLoading}
            className={`overflow-hidden text-ellipsis whitespace-nowrap max-w-full p-2 border ${selectedItems.find(selectedItem => selectedItem.fingerprint === item.fingerprint) ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
            onClick={() => toggleItem(item)}
          >
            {item.quantity} {item.policyId}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button className='mt-4 p-2 bg-green-500 text-white' onClick={handleAction} disabled={isLoading}>
          Perma Lock Selected
        </button>
      </div>
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        content={
          <div className="">
            <h3 className="text-lg font-semibold text-gray-800">Transaction Successful!</h3>
            <p className="text-sm mt-2 text-gray-800">Transaction Hash: {submittedTxHash}</p>
            <br />
            <a
              href={`https://preprod.cardanoscan.io/transaction/${submittedTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700">
              View Transaction
            </a>
          </div>
        }
      />
      {notification && <Notification message={notification} onDismiss={clearNotification} />}
    </div>
  );
};

export default AssetGrid;
