import React, { useState, useEffect, useRef } from 'react';
import { Wallet, ArrowRight, RefreshCcw } from 'lucide-react';
import { ethers } from 'ethers';

const Web3Portfolio = () => {
 const [wallet, setWallet] = useState(null);
 const [provider, setProvider] = useState(null);
 const [walletAddress, setWalletAddress] = useState('');
 const [balance, setBalance] = useState('0');
 const [recipientAddress, setRecipientAddress] = useState('');
 const [amount, setAmount] = useState('');
 const [status, setStatus] = useState('');
 const [loading, setLoading] = useState(false);
 
 const isMounted = useRef(true);
 const providerRef = useRef(null);

 useEffect(() => {
   isMounted.current = true;

   const init = async () => {
     try {
       let newProvider;
       try {
         const wsUrl = import.meta.env.VITE_SEPOLIA_RPC_URL.replace('http', 'ws');
         newProvider = new ethers.providers.WebSocketProvider(wsUrl);
       } catch (e) {
         newProvider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_SEPOLIA_RPC_URL);
       }

       providerRef.current = newProvider;

       if (!import.meta.env.VITE_PRIVATE_KEY) {
         throw new Error('Private key not found in environment variables');
       }

       let privateKey = import.meta.env.VITE_PRIVATE_KEY;
       if (!privateKey.startsWith('0x')) {
         privateKey = '0x' + privateKey;
       }

       const newWallet = new ethers.Wallet(privateKey, newProvider);

       if (isMounted.current) {
         setProvider(newProvider);
         setWallet(newWallet);
         setWalletAddress(newWallet.address);

         const balanceWei = await newProvider.getBalance(newWallet.address);
         if (isMounted.current) {
           setBalance(ethers.utils.formatEther(balanceWei));
           setStatus('Wallet initialized successfully');
         }
       }
     } catch (error) {
       console.error('Initialization error:', error);
       if (isMounted.current) {
         setStatus(`Error initializing wallet: ${error.message}`);
       }
     }
   };

   init();

   return () => {
     isMounted.current = false;
     if (providerRef.current?.destroy) {
       providerRef.current.destroy();
     }
   };
 }, []);

 const checkBalance = async () => {
   if (!walletAddress || !providerRef.current) return;

   try {
     setStatus('Checking balance...');
     const balanceWei = await providerRef.current.getBalance(walletAddress);
     
     if (isMounted.current) {
       setBalance(ethers.utils.formatEther(balanceWei));
       setStatus(
         <div className="bg-green-100 text-green-800 rounded-md p-2">
           Transaction Successfully! ✓
         </div>
       );
     }
   } catch (error) {
     if (isMounted.current) {
       setStatus('Error checking balance: ' + error.message);
       console.error('Balance check error:', error);
     }
   }
 };

 const handleSendTransaction = async (e) => {
   e.preventDefault();
   if (!wallet || !isMounted.current) return;

   setLoading(true);
   setStatus('Processing transaction...');

   try {
     const tx = {
       to: recipientAddress,
       value: ethers.utils.parseEther(amount),
       gasLimit: 21000
     };

     setStatus('Sending transaction...');
     const transaction = await wallet.sendTransaction(tx);
     
     setStatus('Waiting for confirmation...');
     const receipt = await transaction.wait(1);
     
     if (isMounted.current) {
       setStatus(
         <div className="flex flex-col gap-2">
           <div className="bg-green-100 text-green-800 rounded-md p-2">
             Transaction Success! ✓
           </div>
           <div>Hash: {transaction.hash}</div>
           <div className="bg-green-100 text-green-800 rounded-md p-2">
             Balance Updated! ✓
           </div>
         </div>
       );
       await checkBalance();
       setRecipientAddress('');
       setAmount('');
     }
   } catch (error) {
     if (isMounted.current) {
       setStatus(
         <div className="bg-red-100 text-red-800 rounded-md p-2">
           Transaction failed: {error.message}
         </div>
       );
       console.error('Transaction error:', error);
     }
   } finally {
     if (isMounted.current) {
       setLoading(false);
     }
   }
 };

 return (
   <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
     <div className="max-w-xl mx-auto">
       <div className="text-center mb-8">
         <h1 className="text-3xl font-bold text-gray-900">Web3 Sepolia Portfolio</h1>
         <p className="mt-2 text-gray-600">Interact with Ethereum Sepolia Testnet</p>
       </div>

       <div className="bg-white shadow rounded-lg p-6 mb-6">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center">
             <Wallet className="h-5 w-5 text-gray-500 mr-2" />
             <h2 className="text-lg font-medium text-gray-900">Wallet Info</h2>
           </div>
           <button
             onClick={checkBalance}
             className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
           >
             <RefreshCcw className="h-4 w-4 mr-1" />
             Refresh
           </button>
         </div>
         
         <div className="space-y-3">
           <div>
             <label className="block text-sm font-medium text-gray-700">Address</label>
             <div className="mt-1 text-sm text-gray-500 break-all">
               {walletAddress || 'Loading...'}
             </div>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700">Network</label>
             <div className="mt-1 text-sm text-gray-500">
               Sepolia Testnet
             </div>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700">Balance</label>
             <div className="mt-1 text-lg font-medium text-gray-900">
               {balance} ETH
             </div>
           </div>
         </div>
       </div>

       <div className="bg-white shadow rounded-lg p-6">
         <div className="flex items-center mb-4">
           <ArrowRight className="h-5 w-5 text-gray-500 mr-2" />
           <h2 className="text-lg font-medium text-gray-900">Send Transaction</h2>
         </div>

         <form onSubmit={handleSendTransaction} className="space-y-4">
           <div>
             <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
               Recipient Address
             </label>
             <input
               type="text"
               id="recipient"
               value={recipientAddress}
               onChange={(e) => setRecipientAddress(e.target.value)}
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
               placeholder="0x..."
               required
             />
           </div>

           <div>
             <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
               Amount (ETH)
             </label>
             <input
               type="number"
               id="amount"
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
               placeholder="0.01"
               step="0.000000000000000001"
               required
             />
           </div>

           <button
             type="submit"
             disabled={loading || !wallet}
             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
           >
             {loading ? 'Processing...' : 'Send Transaction'}
           </button>
         </form>

         {status && (
           <div className="mt-4 text-sm">
             {status}
           </div>
         )}
       </div>
     </div>
   </div>
 );
};

export default Web3Portfolio;