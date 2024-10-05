"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, Abi, Address } from 'viem';
import { baseSepolia } from 'viem/chains';

const CHAIN_ID_FOR_TOKEN_RECEIPT = baseSepolia.id;

export default function SendTransactionForm() {
    const ERC20_TOKEN_ABI = process.env.NEXT_PUBLIC_USDC_BASE_SEPOLIA_L2_TOKEN_ABI!;
    const ERC20_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS_ON_BASE_SEPOLIA!;
    const POOLED_WALLET_ADDRESS = process.env.NEXT_PUBLIC_POOLED_WALLET_ADDRESS!;

    if (!ERC20_TOKEN_ABI) {
        throw new Error('ERC20_TOKEN_ABI is not defined');
    }

    if (!ERC20_TOKEN_ADDRESS) {
        throw new Error('ERC20_TOKEN_ADDRESS is not defined');
    }

    if (!POOLED_WALLET_ADDRESS) {
        throw new Error('POOLED_WALLET_ADDRESS is not defined');
    }

    // **Type Assertion Here**
    const erc20TokenAddress = ERC20_TOKEN_ADDRESS as Address;
    const pooledWalletAddress = POOLED_WALLET_ADDRESS as Address;
    const erc20TokenABI = JSON.parse(ERC20_TOKEN_ABI) as Abi;

    // Optionally, validate that the addresses start with '0x'
    if (!erc20TokenAddress.startsWith('0x')) {
        throw new Error('erc20TokenAddress must start with "0x"');
    }

    if (!pooledWalletAddress.startsWith('0x')) {
        throw new Error('POOLED_WALLET_ADDRESS must start with "0x"');
    }

    const [amount, setAmount] = useState('100');
    const [apiError, setApiError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const { address, chain } = useAccount();
    const { writeContractAsync, isPending, isSuccess: isConfirmed, isError } = useWriteContract();

    const notifyServer = useCallback(async () => {
        if (txHash && isConfirmed && address) {
            try {
                const response = await fetch('/api/notify-transaction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount,
                        transactionHash: txHash,
                        senderAddress: address,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to notify server');
                }

                setApiError(null);
            } catch (error) {
                console.error('Failed to notify server', error);
                setApiError('Failed to notify server. Please contact support.');
            }
        }
    }, [txHash, isConfirmed, amount, address]);

    useEffect(() => {
        notifyServer();
    }, [notifyServer]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!amount) return;

        try {
            const data = await writeContractAsync({
                chainId: CHAIN_ID_FOR_TOKEN_RECEIPT,
                address: erc20TokenAddress,
                functionName: 'transfer',
                abi: erc20TokenABI,
                args: [pooledWalletAddress, parseUnits(amount, 6)],
            });
            setTxHash(data);
            console.log(data);
        } catch (error) {
            console.error('Transaction failed:', error);
            setApiError('Transaction failed. Please try again.');
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 w-full max-w-md mx-auto p-4">
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
            <div>
                <input
                    type="text"
                    placeholder="Amount (USDC)"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isPending}
                    className="border border-gray-300 p-2 rounded w-full text-lg text-black font-semibold text-center bg-gray-200"
                />
            </div>
            <button
                type="submit"
                disabled={!address || !chain || isPending || !amount}
                className="bg-[#121313] text-white p-2 rounded border border-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-lg font-semibold font-poppins"
                style={{ fontWeight: 600 }}
            >
                {isPending ? 'Processing...' : `Deposit ${amount || '0'} USDC`}
            </button>
            <div className="border border-gray-300 bg-black p-4 rounded text-sm text-gray-300">
                <p className="mb-1">
                    <strong>Note from Propel:</strong>
                </p>
                <p className="mb-3">
                    Most USDC deposits on Base Sepolia are instant, but some may take up to 24 hours to reflect in your account.
                </p>
                <p>In case of any issues, please contact support@propelapp.in.</p>
                {isError && <p className="text-red-500 mt-2">Could not process the transaction. Please retry.</p>}
                {isConfirmed && (
                    <p className="text-green-500 mt-2">Transaction confirmed. You can return to the main app.</p>
                )}
                {txHash && <p className="break-all mt-2">Transaction hash: {txHash}</p>}
                {apiError && <p className="text-red-500 mt-2">{apiError}</p>}
            </div>
        </form>
    );
}
