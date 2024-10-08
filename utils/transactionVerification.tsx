import { createConfig, http, getPublicClient } from '@wagmi/core'
import { baseSepolia } from 'viem/chains'
import { parseAbiItem, decodeEventLog, Address, Hash } from 'viem';

const config = createConfig({
    chains: [baseSepolia],
    transports: {
        [baseSepolia.id]: http(),
    },
})

export async function verifyTransactionHash(
    txHash: Hash,
    expectedAmount: bigint,
    expectedRecipient: Address
): Promise<boolean> {
    try {
        console.log('Verifying transaction:', txHash);
        const publicClient = getPublicClient(config)
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

        // Check transaction timestamp
        const block = await publicClient.getBlock({ blockHash: receipt.blockHash });
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime - Number(block.timestamp) > 300) { // 5 minutes = 300 seconds
            console.error('Transaction is older than 5 minutes');
            return false;
        }

        const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

        const transferLog = receipt.logs.find(log => {
            try {
                const event = decodeEventLog({
                    abi: [transferEventAbi],
                    data: log.data,
                    topics: log.topics,
                });
                return event.eventName === 'Transfer';
            } catch {
                return false;
            }
        });

        if (!transferLog) {
            console.error('Transfer event not found in transaction logs');
            return false;
        }

        const decodedEvent = decodeEventLog({
            abi: [transferEventAbi],
            data: transferLog.data,
            topics: transferLog.topics,
        });

        const recipient = decodedEvent.args.to as Address;
        const amount = decodedEvent.args.value as bigint;

        if (recipient.toLowerCase() !== expectedRecipient.toLowerCase()) {
            console.error('Recipient mismatch', recipient, expectedRecipient);
            return false;
        }

        if (amount !== expectedAmount) {
            console.error('Amount mismatch', amount, expectedAmount);
            return false;
        }

        console.log('Transaction verified successfully');
        return true;
    } catch (error) {
        console.error('Error verifying transaction:', error);
        return false;
    }
}