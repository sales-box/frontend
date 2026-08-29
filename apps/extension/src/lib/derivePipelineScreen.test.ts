import { describe, it, expect } from 'vitest'
import { derivePipelineScreen, type PipelineResponse } from './derivePipelineScreen'

// A response the backend would actually emit. Tests override only the field
// under test — the old suite used a 0.72 history value the supervisor cannot
// produce below four logged interactions.
function makeResponse(overrides: Partial<PipelineResponse> = {}): PipelineResponse {
  return {
    confidence: {
      productConfidence: 0.94,
      clientHistoryConfidence: 1,
      label: 'auto_worthy',
      labelReason: 'confidence',
      hallucinationDetected: false,
    },
    classification: {
      intent: 'product inquiry',
      intentConfidence: 0.93,
      isUrgent: false,
      supervisorLabel: 'green',
    },
    client: { name: 'Alice', company: 'Acme', status: 'active' },
    draft: { draftText: 'Hi Alice…' },
    emailTimestamp: '2026-07-21T10:00:00Z',
    ...overrides,
  }
}

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

  it('maps client, scores and draft onto the briefing', () => {
    const out = derivePipelineScreen(makeResponse())
    expect(out.kind).toBe('briefing')
    if (out.kind !== 'briefing') return
    expect(out.data.clientName).toBe('Alice')
    expect(out.data.company).toBe('Acme')
    expect(out.data.dealStatus).toBe('active')
    expect(out.data.productConfidence).toBe(94)
    expect(out.data.clientHistoryConfidence).toBe(100)
    expect(out.data.suggestedReply).toBe('Hi Alice…')
  })

  describe('routes on confidence.label, not on the scores', () => {
    it('auto_worthy → green briefing', () => {
      const out = derivePipelineScreen(makeResponse())
      expect(out.kind).toBe('briefing')
      if (out.kind === 'briefing') expect(out.data.routing).toBe('green')
    })

    it('needs_review → the yellow briefing, not the red screen', () => {
      // The state that had no screen at all: safe enough to draft, not safe
      // enough to send unread.
      const out = derivePipelineScreen(
        makeResponse({
          confidence: {
            productConfidence: 0.94,
            clientHistoryConfidence: 0.4,
            label: 'needs_review',
            labelReason: 'thin_history',
            hallucinationDetected: false,
          },
        }),
      )
      expect(out.kind).toBe('briefing')
      if (out.kind === 'briefing') {
        expect(out.data.routing).toBe('yellow')
        expect(out.data.labelReason).toBe('thin_history')
      }
    })

    it('handle_manually → red, even at 99% on both scores', () => {
      // A sensitive thread the KB answers perfectly. The old OR-gate saw two
      // high numbers and showed the green screen with its one-click Send.
      const out = derivePipelineScreen(
        makeResponse({
          confidence: {
            productConfidence: 0.99,
            clientHistoryConfidence: 0.99,
            label: 'handle_manually',
            labelReason: 'sensitive_intent',
            hallucinationDetected: false,
          },
        }),
      )
      expect(out.kind).toBe('low-confidence')
      if (out.kind === 'low-confidence') {
        expect(out.data.routing).toBe('red')
        expect(out.data.labelReason).toBe('sensitive_intent')
      }
    })

    it('keeps a well-known client green when history is thin but the label says go', () => {
      // THE bug: history confidence is 0.4 until the third logged interaction,
      // so the 60/60 OR-gate red-flagged effectively every email.
      const out = derivePipelineScreen(
        makeResponse({
          confidence: {
            productConfidence: 0.94,
            clientHistoryConfidence: 0.4,
            label: 'auto_worthy',
            labelReason: 'confidence',
            hallucinationDetected: false,
          },
        }),
      )
      expect(out.kind).toBe('briefing')
    })
  })

  it('reports a failed pipeline as its own reason, not as a hallucination', () => {
    // The draft graph threw, so there is no draft. Saying "a claim contradicts
    // the knowledge base" here points the SE at a draft that does not exist.
    const out = derivePipelineScreen(
      makeResponse({
        draft: undefined,
        confidence: {
          productConfidence: 0.52,
          clientHistoryConfidence: 0.4,
          label: 'handle_manually',
          labelReason: 'pipeline_error',
          hallucinationDetected: false,
        },
      }),
    )
    expect(out.kind).toBe('low-confidence')
    if (out.kind === 'low-confidence') {
      expect(out.data.labelReason).toBe('pipeline_error')
      expect(out.data.suggestedReply).toBe('')
    }
  })

  it('vetoes a hallucinated draft to red whatever the label claims', () => {
    // Client-side backstop: a version-skewed backend must not be able to put a
    // hallucinated draft on the screen that has a one-click Send.
    const out = derivePipelineScreen(
      makeResponse({
        confidence: {
          productConfidence: 0.95,
          clientHistoryConfidence: 0.95,
          label: 'auto_worthy',
          labelReason: 'confidence',
          hallucinationDetected: true,
        },
      }),
    )
    expect(out.kind).toBe('low-confidence')
  })

  describe('fallback when no label is present', () => {
    // Drafts cached by an older build, or a backend deployed before the label.
    it('uses the legacy OR-gate and red-flags a low score', () => {
      const out = derivePipelineScreen(
        makeResponse({
          confidence: { productConfidence: 0.4, clientHistoryConfidence: 0.8 },
        }),
      )
      expect(out.kind).toBe('low-confidence')
      if (out.kind === 'low-confidence') {
        expect(out.data.missingContext.hasProductDocs).toBe(false)
        expect(out.data.missingContext.hasPreviousEmails).toBe(true)
      }
    })

    it('stays green when both legacy scores clear 60', () => {
      const out = derivePipelineScreen(
        makeResponse({
          confidence: { productConfidence: 0.85, clientHistoryConfidence: 0.8 },
        }),
      )
      expect(out.kind).toBe('briefing')
    })
  })

  describe('classification reaches the screen', () => {
    it('carries intent and urgency through', () => {
      const out = derivePipelineScreen(
        makeResponse({
          classification: {
            intent: 'sensitive',
            intentConfidence: 0.97,
            isUrgent: true,
            urgencyReason: 'Client threatens to cancel.',
            supervisorLabel: 'red',
          },
          confidence: {
            productConfidence: 0.98,
            clientHistoryConfidence: 1,
            label: 'handle_manually',
            labelReason: 'sensitive_intent',
            hallucinationDetected: false,
          },
        }),
      )
      expect(out.kind).toBe('low-confidence')
      if (out.kind === 'low-confidence') {
        expect(out.data.intent).toBe('sensitive')
        expect(out.data.isUrgent).toBe(true)
      }
    })

    it('degrades to null/false when classification is absent', () => {
      const out = derivePipelineScreen(makeResponse({ classification: undefined }))
      if (out.kind === 'briefing') {
        expect(out.data.intent).toBeNull()
        expect(out.data.isUrgent).toBe(false)
      }
    })
  })

  it('sets a real dealStatus on the red screen too, not a hardcoded prospect', () => {
    const out = derivePipelineScreen(
      makeResponse({
        client: { name: 'Alice', company: 'Acme', status: 'active' },
        confidence: {
          productConfidence: 0.99,
          clientHistoryConfidence: 0.99,
          label: 'handle_manually',
          labelReason: 'sensitive_intent',
        },
      }),
    )
    expect(out.kind).toBe('low-confidence')
    if (out.kind === 'low-confidence') expect(out.data.dealStatus).toBe('active')
  })

  it('leaves a missing company empty so the UI can omit the placeholder', () => {
    const out = derivePipelineScreen({
      draft: { draftText: 'Reply' },
      confidence: {
        productConfidence: 0.9,
        clientHistoryConfidence: 0.9,
        label: 'auto_worthy',
      },
      client: { name: 'Karim', status: 'new_inquiry' },
    })

    expect(out.kind).toBe('briefing')
    if (out.kind === 'briefing') {
      expect(out.data.company).toBe('')
      expect(out.data.dealStatus).toBe('prospect')
    }
  })

  // The badge compared against the literal 'active', which no backend path has
  // written since the CRM lifecycle mapping landed, so every sender read "New"
  // — including a contact HubSpot marks as a customer.
  describe('dealStatus against the real status vocabulary', () => {
    const withStatus = (status: string) =>
      derivePipelineScreen(
        makeResponse({ client: { name: 'Alice', company: 'Acme', status } }),
      )

    it.each(['customer', 'opportunity', 'active'])('reads %s as a live deal', (status) => {
      const out = withStatus(status)
      expect(out.kind).toBe('briefing')
      if (out.kind === 'briefing') expect(out.data.dealStatus).toBe('active')
    })

    it.each(['new_inquiry', 'qualified', '', 'something_new'])(
      'reads %p as a prospect',
      (status) => {
        const out = withStatus(status)
        expect(out.kind).toBe('briefing')
        if (out.kind === 'briefing') expect(out.data.dealStatus).toBe('prospect')
      },
    )
  })
})
