'use client';
import { Copy, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, Abi, Address, Hash } from 'viem';
import { baseSepolia } from 'viem/chains';
import { TransactionStatus, StatusType } from '../utils/transactionStatus';
import { verifyTransactionHash } from '../utils/transactionVerification';

const CHAIN_ID_FOR_TOKEN_RECEIPT = baseSepolia.id;

interface UserInfo {
    userId: string;
    userName: string;
}

export default function SendTransactionForm() {
    const ERC20_TOKEN_ABI = process.env.NEXT_PUBLIC_USDC_BASE_SEPOLIA_L2_TOKEN_ORIGINAL_ABI!;
    const ERC20_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS_ON_BASE_SEPOLIA!;
    const POOLED_WALLET_ADDRESS = process.env.NEXT_PUBLIC_POOLED_WALLET_ADDRESS!;

    if (!ERC20_TOKEN_ABI || !ERC20_TOKEN_ADDRESS || !POOLED_WALLET_ADDRESS) {
        throw new Error('Required environment variables are not defined');
    }

    const erc20TokenAddress = ERC20_TOKEN_ADDRESS as Address;
    const pooledWalletAddress = POOLED_WALLET_ADDRESS as Address;
    const erc20TokenABI = JSON.parse(ERC20_TOKEN_ABI) as Abi;

    const [copied, setCopied] = useState(false);
    const [amount, setAmount] = useState('1');
    const [status, setStatus] = useState<TransactionStatus | null>(null);
    const [statusType, setStatusType] = useState<StatusType>('success');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { address, chain } = useAccount();
    const { writeContractAsync, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash as `0x${string}`,
    });

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/api/auth/decode-jwt');
                if (response.ok) {
                    const data = await response.json();
                    if (data.payload) {
                        setUserInfo(data.payload);
                    } else {
                        console.error('No payload in decoded JWT response');
                    }
                } else {
                    console.error('Failed to fetch user info:', await response.text());
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === TransactionStatus.WALLET_CREDITED) {
            setStatusType('success');
            timer = setTimeout(() => {
                setStatus(null);
                setStatusType('success');
            }, 120000); // 2 minutes
        } else if (status === TransactionStatus.WALLET_REJECTED || status === TransactionStatus.HASH_VERIFICATION_FAILED || status === TransactionStatus.DUPLICATE_TRANSACTION) {
            setStatusType('error');
        } else {
            setStatusType('success');
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [status]);

    const notifyServer = useCallback(async () => {
        if (txHash && isConfirmed && address) {
            try {
                console.log('Starting transaction verification');
                setStatus(TransactionStatus.VERIFYING_HASH);
                const isVerified = await verifyTransactionHash(txHash as Hash, parseUnits(amount, 6), pooledWalletAddress as Address);

                if (!isVerified) {
                    console.error('Transaction verification failed');
                    throw new Error('Transaction verification failed');
                }

                console.log('Transaction verified, checking for duplicates');
                setStatus(TransactionStatus.CHECKING_DUPLICATES);
                const response = await fetch('/api/notify-transaction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ amount, transactionHash: txHash, senderAddress: address }),
                });

                if (response.status === 409) {
                    console.log('Duplicate transaction detected');
                    setStatus(TransactionStatus.DUPLICATE_TRANSACTION);
                    setStatusType('error');
                } else if (!response.ok) {
                    console.error('Failed to notify server:', response.statusText);
                    throw new Error('Failed to notify server');
                } else {
                    console.log('Transaction processed successfully');
                    setStatus(TransactionStatus.WALLET_CREDITED);
                    setStatusType('success');
                    setTimeout(() => window.close(), 120000); // Close window after 2 minutes
                }
            } catch (error) {
                console.error('Failed to process transaction:', error);
                setStatus(TransactionStatus.HASH_VERIFICATION_FAILED);
                setStatusType('error');
            }
        }
    }, [txHash, isConfirmed, amount, address, pooledWalletAddress]);

    useEffect(() => {
        notifyServer();
    }, [notifyServer]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!amount) return;
        // Clear the transaction hash when initiating a new transaction
        setTxHash(null);
        try {
            console.log('Initiating transaction');
            setStatus(TransactionStatus.SENT_TO_WALLET);
            setStatusType('success');
            const data = await writeContractAsync({
                chainId: CHAIN_ID_FOR_TOKEN_RECEIPT,
                address: erc20TokenAddress,
                functionName: 'transfer',
                abi: erc20TokenABI,
                args: [pooledWalletAddress, parseUnits(amount, 6)],
            });
            setTxHash(data);
            //console.log('Transaction sent, hash:', data);
            setStatus(TransactionStatus.AWAITING_HASH);
        } catch (error) {
            console.error('Transaction failed:', error);
            setStatus(TransactionStatus.WALLET_REJECTED);
            setStatusType('error');
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
    };

    const copyToClipboard = (e: React.MouseEvent) => {
        e.preventDefault();
        if (txHash) {
            navigator.clipboard.writeText(txHash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            console.log('Transaction hash copied to clipboard');
        }
    };
    const getStatusStyle = (type: StatusType) => {
        return type === 'success'
            ? 'bg-green-900/20 text-green-400 border-green-800'
            : 'bg-red-900/20 text-red-400 border-red-800';
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 w-full max-w-md mx-auto p-4">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
                body {
                    font-family: 'Poppins', sans-serif;
                }
            `}</style>
            {userInfo && userInfo.userName && (
                <h2 className="text-2xl font-bold text-center mb-4">Hi {userInfo.userName}</h2>
            )}
            <div>
                <input
                    type="text"
                    placeholder="Amount (USDC)"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isPending || isConfirming}
                    className="border border-gray-300 p-2 rounded w-full text-lg text-black font-semibold text-center bg-gray-200"
                />
            </div>
            <button
                type="submit"
                disabled={!address || !chain || isPending || isConfirming || !amount || chain.id !== CHAIN_ID_FOR_TOKEN_RECEIPT}
                className="bg-[#121313] text-white p-2 rounded border border-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-lg font-semibold font-poppins"
                style={{ fontWeight: 600 }}
            >
                {isPending || isConfirming ? 'Processing...' : `Deposit ${amount || '0'} USDC`}
            </button>
            {chain && chain.id !== CHAIN_ID_FOR_TOKEN_RECEIPT && (
                <p className="text-red-500 text-sm">
                    We currently only support deposits from the Base Sepolia chain. Please change your chain to process transactions.
                </p>
            )}
            {status && (
                <div className={`p-2 rounded ${getStatusStyle(statusType)} border`}>
                    {status}
                </div>
            )}
            <div className="border border-gray-300 bg-black p-4 rounded text-sm text-gray-300">
                <p className="mb-1">
                    <strong>Note from Propel:</strong>
                </p>
                <p className="mb-3">
                    Most USDC deposits are instant, but some may take up to 24 hours to reflect in your account.
                </p>
                <p>In case of any issues, please contact support@propelapp.in.</p>
                {txHash && (
                    <div className="mt-2 flex items-center">
                        <p className="break-all mr-2">
                            <span className="text-white">Transaction hash:</span>{' '}
                            <span className="text-gray-500">{txHash}</span>
                        </p>
                        <button onClick={copyToClipboard} className="text-blue-500 hover:text-blue-700">
                            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                )}
            </div>
        </form>
    );
}
