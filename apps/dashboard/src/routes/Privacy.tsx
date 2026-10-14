import { LegalLayout, type LegalSection } from "../components/LegalLayout"

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        <p>Inbox Sales Copilot ("we", "us") is a multi-tenant B2B SaaS platform that helps Sales Engineers at subscribing companies draft email replies to clients, using AI grounded in each company's own product knowledge and client history. It's delivered as a Chrome extension that runs inside Gmail, and a separate web dashboard for company administrators.</p>
        <p>This policy explains what data we collect, why, and how it's protected — including from other companies using the platform.</p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p><strong>Account and company data:</strong> when a company signs up, we collect the administrator's email, password, and company name to create the company's account ("Tenant").</p>
        <p><strong>Gmail access:</strong> each Sales Engineer connects their own personal Gmail account individually via Google OAuth (specifically requesting the <code>https://www.googleapis.com/auth/gmail.readonly</code> scope) — this is never a shared team inbox. We access the content of emails a Sales Engineer opens in order to classify the message and draft a suggested reply. A Sales Engineer's email can only be connected after their company's administrator has explicitly added it to that company's approved user list.</p>
        <p><strong>Knowledge base documents:</strong> product catalogs, price lists, and other materials a company's administrator uploads. This is the only source the AI is allowed to treat as authoritative "product truth" for that company.</p>
        <p><strong>Client-sent attachments:</strong> files clients send in the course of email conversations (spreadsheets, PDFs, Word documents, etc.) are parsed and converted to a normalized text format so the AI can read them. This content is kept strictly scoped to the specific client who sent it and is never used to answer questions from a different client.</p>
        <p><strong>CRM data:</strong> if a company connects a CRM (HubSpot today, Zoho planned), we read client and deal records from it to build context for replies. This connection is read-only — we never write or modify anything in a connected CRM automatically.</p>
        <p><strong>Usage data:</strong> whether a Sales Engineer sent an AI-drafted reply as-is or edited it first. This feeds only an aggregate, company-level analytics view for that company's administrator — it does not train or change how the AI responds.</p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <>
        <p>Email and attachment content is processed by our AI pipeline to classify the message, understand what the client is asking for, find relevant information in the company's knowledge base, and draft a suggested reply. Every draft is checked against real source material before a Sales Engineer sees it — no draft is ever sent automatically, at any confidence level. A Sales Engineer reviews, edits if needed, and sends every message themselves.</p>
        <p>We deliberately keep two categories of knowledge separate and never mix them: a company's official knowledge base (uploaded by their administrator) is the only source used to answer questions with high confidence; content extracted from a specific client's own attachments is used only for replies to that same client, never surfaced as general product information to anyone else. This exists specifically to prevent something said privately to one client (like a custom discount) from leaking into a reply sent to a different client.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    body: (
      <>
        <p>Parsed attachment content used to speed up repeated AI processing is temporarily cached and automatically deleted after 24 hours.</p>
        <p>When a reply is generated using a knowledge base document, we keep a lightweight independent record of which document was used and a short excerpt, even if that document is later deleted or updated — this preserves an audit trail (e.g. to answer "what did we tell this client at the time?") without keeping a live dependency on the original file.</p>
        <p>When a company's administrator removes a Sales Engineer's access, that person's ability to connect and their active Google authorization are revoked immediately. The client conversation history itself is not deleted — it belongs to the company (Tenant), not to the individual Sales Engineer, and remains available to whoever at that company handles that client next.</p>
        <p>For accounts that are fully closed or terminated, we revoke access and authorization tokens immediately. We will manually delete the company's full dataset from our databases within 30 days of receiving a deletion request from the company administrator sent to salesbox@support.com.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Third-party sharing",
    body: (
      <>
        <p>We share data with the AI service providers we use to generate drafts, solely to provide that functionality. We utilize third-party AI models from providers including OpenAI and Google Gemini. These AI service providers do not use your company or client data to train their models, and their use is governed by their respective business data protection terms.</p>
        <p>If a company connects a CRM, we exchange data with that CRM provider (HubSpot today, Zoho planned) — read-only, to pull client context into the sidebar. We do not sell any company's data or their clients' data to third parties.</p>
      </>
    ),
  },
  {
    id: "isolation",
    title: "Data isolation between companies",
    body: <p>Every company's data — knowledge base, client records, conversation history, and every AI query — is strictly isolated by company. No employee at one company can access another company's data, even while both are using the platform at the same time.</p>,
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: <p>Under applicable privacy laws like GDPR and CCPA, you may request access to, correction of, or manual deletion of your personal data. Deletion requests are currently handled manually, not through automated tooling. To exercise these rights, please contact us at salesbox@support.com. Deletion requests are processed manually within 30 days of verification.</p>,
  },
  {
    id: "contact",
    title: "Contact us",
    body: <p>Questions about this policy can be sent to salesbox@support.com.</p>,
  },
]

export function Privacy() {
  return <LegalLayout pageTitle="Privacy Policy" lastUpdated="July 18, 2026" sections={sections} />
}
