import { describe, it, expect } from 'vitest'
import { derivePipelineScreen, type PipelineResponse } from './derivePipelineScreen'

describe('derivePipelineScreen', () => {
  it('alreadyReplied returns replied with summary passthrough', () => {
    const raw: PipelineResponse = {
      alreadyReplied: true,
      summary: { intent: 'demo', productConfidence: 0.9, clientHistoryConfidence: 0.8, supervisorLabel: null },
    }
    const out = derivePipelineScreen(raw)
    expect(out.kind).toBe('replied')
    if (out.kind === 'replied') expect(out.summary).toEqual(raw.summary)
  })

  it('high confidence returns briefing with mapped fields', () => {
    const raw: PipelineResponse = {
      confidence: { productConfidence: 0.85, clientHistoryConfidence: 0.72, hallucinationDetected: false },
      client: { name: 'Alice', company: 'Acme', status: 'active' },
      draft: { draftText: 'Hi Alice…' },
      emailTimestamp: '2026-07-21T10:00:00Z',
    }
    const out = derivePipelineScreen(raw)
    expect(out.kind).toBe('briefing')
    if (out.kind === 'briefing') {
      expect(out.data.clientName).toBe('Alice')
      expect(out.data.company).toBe('Acme')
      expect(out.data.dealStatus).toBe('active')
      expect(out.data.productConfidence).toBe(85)
      expect(out.data.clientHistoryConfidence).toBe(72)
      expect(out.data.suggestedReply).toBe('Hi Alice…')
    }
  })

  it('low product confidence returns low-confidence with hasProductDocs=false', () => {
    const raw: PipelineResponse = {
      confidence: { productConfidence: 0.40, clientHistoryConfidence: 0.80, hallucinationDetected: false },
      client: { name: 'Bob', company: 'Foo', status: 'prospect' },
      draft: { draftText: '' },
      emailTimestamp: '2026-07-21T10:00:00Z',
    }
    const out = derivePipelineScreen(raw)
    expect(out.kind).toBe('low-confidence')
    if (out.kind === 'low-confidence') {
      expect(out.data.missingContext.hasProductDocs).toBe(false)
      expect(out.data.missingContext.hasPreviousEmails).toBe(true)
    }
  })

  it('hallucination flag routes to low-confidence even with high scores', () => {
    const raw: PipelineResponse = {
      confidence: { productConfidence: 0.95, clientHistoryConfidence: 0.95, hallucinationDetected: true },
      client: { name: 'X', company: 'Y', status: 'active' },
      draft: { draftText: 'text' },
      emailTimestamp: '2026-07-21T10:00:00Z',
    }
    const out = derivePipelineScreen(raw)
    expect(out.kind).toBe('low-confidence')
  })
})
