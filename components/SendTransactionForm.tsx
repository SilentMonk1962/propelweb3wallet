"use client"
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { sepolia } from 'viem/chains'

const TOKEN_ABI = [{ "inputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint8", "name": "decimals", "type": "uint8" }, { "internalType": "address", "name": "owner", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [], "name": "DOMAIN_SEPARATOR", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "EIP712_REVISION", "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "PERMIT_TYPEHASH", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "mint", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "mint", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "nonces", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "permit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];
const CHAIN_ID_FOR_TOKEN_RECEIPT = sepolia.id

export default function SendTransactionForm() {
    const POOLED_WALLET_ADDRESS = process.env.NEXT_PUBLIC_POOLED_WALLET_ADDRESS;
    const USDT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS
    if (!USDT_TOKEN_ADDRESS) {
        throw new Error('NEXT_PUBLIC_USDT_TOKEN_ADDRESS is not defined');
    }

    if (!POOLED_WALLET_ADDRESS) {
        throw new Error('NEXT_PUBLIC_POOLED_WALLET_ADDRESS is not defined');
    }


    const [amount, setAmount] = useState('100')
    const [apiError, setApiError] = useState<string | null>(null)
    const [txHash, setTxHash] = useState<string | null>(null)

    const { address, chain } = useAccount()
    const { writeContractAsync, isPending, isSuccess: isConfirmed, isError } = useWriteContract()

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
                })

                if (!response.ok) {
                    throw new Error('Failed to notify server')
                }

                setApiError(null)
            } catch (error) {
                console.error('Failed to notify server', error)
                setApiError('Failed to notify server. Please contact support.')
            }
        }
    }, [txHash, isConfirmed, amount, address])

    useEffect(() => {
        notifyServer()
    }, [notifyServer])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!amount) return

        try {
            const data = await writeContractAsync({
                chainId: CHAIN_ID_FOR_TOKEN_RECEIPT,
                address: USDT_TOKEN_ADDRESS,
                functionName: "transfer",
                abi: TOKEN_ABI,
                args: [POOLED_WALLET_ADDRESS, parseUnits(amount, 6)],
            })
            setTxHash(data)
            console.log(data)
        } catch (error) {
            console.error('Transaction failed:', error)
            setApiError('Transaction failed. Please try again.')
        }
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '')
        setAmount(value)
    }

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
                    placeholder="Amount (USDT)"
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
                {isPending ? 'Processing...' : `Deposit ${amount || '0'} USDT`}
            </button>
            <div className="border border-gray-300 bg-black p-4 rounded text-sm text-gray-300">
                <p className="mb-1">
                    <strong>Note from Propel:</strong>
                </p>
                <p className="mb-3">
                    Most USDT deposits are instant, but some may take up to 24 hours to reflect in your account.
                </p>
                <p>
                    In case of any issues, please contact support@propelapp.in.
                </p>
                {isError && <p className="text-red-500 mt-2">Could not process the transaction. Please retry.</p>}
                {isConfirmed && <p className="text-green-500 mt-2">Transaction confirmed. You can return to the main app.</p>}
                {txHash && <p className="break-all mt-2">Transaction hash: {txHash}</p>}
                {apiError && <p className="text-red-500 mt-2">{apiError}</p>}
            </div>
        </form>
    )
}