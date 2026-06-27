'use client'

import { useState } from 'react'

type Props = {
  faq: string[][]
}

export default function PlanFaq({ faq }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="pl-faq">
      <h2 className="pl-faq-title">Common <em>questions</em></h2>
      {faq.map(([q, a], i) => (
        <div key={i} className="pl-faq-item">
          <button
            className="pl-faq-q"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span>{q}</span>
            <span className="pl-faq-plus">{openIndex === i ? '−' : '+'}</span>
          </button>
          <div className={`pl-faq-a${openIndex === i ? ' open' : ''}`}>{a}</div>
        </div>
      ))}
    </div>
  )
}
