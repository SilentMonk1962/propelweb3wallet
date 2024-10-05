'use client';

import { useAccount, useBalance } from 'wagmi';

export default function UserBalance() {
    const { address, isConnected } = useAccount(); // Get the connected wallet address

    // Fetch user's balance
    const { data, isError, isLoading } = useBalance({
        address, // Fetch the balance for the connected wallet address
    });

    if (isLoading) return <div>Fetching balance...</div>;
    if (isError) return <div>Error fetching balance.</div>;

    return (
        <div>
            {isConnected ? (
                <div>
                    <p>Address: {address}</p>
                    <p>Balance: {data?.formatted} {data?.symbol}</p>
                </div>
            ) : (
                <p>Please connect your wallet.</p>
            )}
        </div>
    );
}
