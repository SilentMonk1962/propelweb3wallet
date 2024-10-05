'use client'

import { useState, useEffect } from 'react'
import ConnectBtn from "@/components/ConnectBtn"
import SendTransactionForm from "@/components/SendTransactionForm"
import { useAccount } from "wagmi"
import Image from 'next/image'

export default function Home() {
  const { isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
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