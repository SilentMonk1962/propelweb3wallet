
// context/index.tsx
'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { sepolia, mainnet, arbitrum, avalanche, base, optimism, polygon, baseSepolia } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

//for user transaction, we will use Viem



// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
    throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
    name: 'Propel',
    linkMode: true,
    description: 'AppKit with the best ux in the world',
    url: 'https://web3.propelapp.in', // origin must match your domain & subdomain
    icons: ['https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/r-s-a-exchange-zrel8y/assets/neoldnb7fyt8/main_playstore_logo_dark_v2.png']
}

// Create the modal
const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [sepolia, baseSepolia, mainnet, arbitrum, avalanche, base, optimism, polygon],
    defaultNetwork: baseSepolia,
    metadata: metadata,
    features: {
        email: false,
        socials: false,
        emailShowWallets: false,
        analytics: true, // Optional - defaults to your Cloud configuration
    },
    termsConditionsUrl: "https://propelapp.in/terms",
    privacyPolicyUrl: "https://propelapp.in/privacy",
    featuredWalletIds: [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
        "6adb6082c909901b9e7189af3a4a0223102cd6f8d5c39e39f3d49acb92b578bb",
        "3ed8cc046c6211a798dc5ec70f1302b43e07db9639fd287de44a9aa115a21ed6"
    ],

})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider
