// utils/transactionStatus.ts
export enum TransactionStatus {
    SENT_TO_WALLET = 'Transaction is sent to your wallet.',
    WALLET_REJECTED = 'Your wallet rejected the transaction.',
    AWAITING_HASH = 'Wallet confirmed the transaction, awaiting hash.',
    VERIFYING_HASH = 'Verifying the transaction hash on the chain.',
    HASH_VERIFICATION_FAILED = 'Transaction hash could not be verified, we\'ve created a support ticket to check the issue.',
    CHECKING_DUPLICATES = 'Transaction confirmed, we\'re checking for duplicate entries in our database.',
    NO_DUPLICATES = 'No duplicate entries found, crediting your wallet.',
    DUPLICATE_TRANSACTION = 'Duplicate transaction detected. The transaction has been rejected. Please contact support if you believe this is an error.',
    WALLET_CREDITED = 'Wallet credited, you can copy the transaction hash if required, this window will automatically close in two minutes.',
}

export type StatusType = 'success' | 'error';

export function getStatusStyle(type: StatusType): string {
    return type === 'success'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
}