'use client'

import { useState, useEffect } from 'react'
import { useAccount } from "wagmi"
import Image from 'next/image'
import dynamic from 'next/dynamic'

const ConnectBtn = dynamic(() => import("@/components/ConnectBtn"), { ssr: false })
const SendTransactionForm = dynamic(() => import("@/components/SendTransactionForm"), { ssr: false })

export default function Home() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="relative min-h-screen">
        <Image
          src="/images/background.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <Image
        src="/images/background.jpg"
        alt="Background"
        layout="fill"
        objectFit="cover"
        priority
      />
      <div className="relative z-10 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <ConnectBtn />
          {isConnected && <SendTransactionForm />}
        </main>
        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        </footer>
      </div>
    </div>
  )
}