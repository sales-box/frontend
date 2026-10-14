import { LegalLayout, type LegalSection } from "../components/LegalLayout"

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: <p>By creating a company account or using Inbox Sales Copilot as an authorized Sales Engineer, you agree to these Terms of Service. If you're accepting on behalf of a company, you confirm you have the authority to do so.</p>,
  },
  {
    id: "the-service",
    title: "The service",
    body: (
      <>
        <p>Inbox Sales Copilot is an AI-assisted email drafting service for B2B sales teams, delivered as a Chrome extension that runs inside Gmail and a web dashboard for administrators. Each Sales Engineer connects their own individual Gmail account — the service does not support a shared team inbox.</p>
        <p>Companies may optionally connect a supported CRM (HubSpot today, Zoho planned) on a read-only basis for additional client context. The service never writes to a connected CRM automatically — any CRM update is made manually by the Sales Engineer.</p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and roles",
    body: (
      <>
        <p>Each company account has exactly one administrator in the current version of the product (multi-administrator support is not yet available). The administrator manages which Sales Engineers may use the service via an approved-user list, and can remove that access at any time — doing so immediately revokes that Sales Engineer's connected Gmail authorization.</p>
        <p>A Sales Engineer's email must be added to their company's approved list by the administrator before they can connect their Gmail account; the connection is rejected even if Google's own consent screen was approved.</p>
        <p>Our service is designed exclusively for business use (B2B). Users must be at least 18 years of age and authorized by their company to use the service.</p>
      </>
    ),
  },
  {
    id: "subscription",
    title: "Subscription and billing",
    body: (
      <>
        <p>Plans and pricing are as published on our pricing page at the time of purchase, billed via Stripe.</p>
        <p>You may cancel your subscription at any time. Cancellations will take effect at the end of the current billing cycle, and no refunds or credits will be provided for partial periods of service or unused time.</p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You may not attempt to access another company's data, reverse engineer the extension or dashboard, use the service to send spam or misleading claims to clients, or attempt to exceed your plan's seat or document limits by circumventing account controls.</p>
      </>
    ),
  },
  {
    id: "ai-disclaimer",
    title: "AI-generated content",
    body: (
      <>
        <p>AI-drafted replies are suggestions only. No reply is ever sent automatically by the system, at any confidence level — every message is reviewed and sent by a human Sales Engineer at your company. We check every draft against your uploaded knowledge base and remove or flag any claim we can't verify against a real source before a Sales Engineer ever sees it, but we do not guarantee the factual accuracy of AI-generated drafts, and you should not send one without reviewing it yourself.</p>
        <p>By default, replies are sent from the Sales Engineer's own Gmail account with no automatic disclosure that AI assistance was used. Whether to disclose AI involvement to your clients is your company's decision to make.</p>
      </>
    ),
  },
  {
    id: "client-data-ownership",
    title: "Client data ownership",
    body: <p>Conversation history with a client belongs to your company (the Tenant), not to the individual Sales Engineer who handled it. If a Sales Engineer's access is revoked, that history remains intact and is available to whoever at your company takes over that client relationship next.</p>,
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <>
        <p>You retain ownership of the documents, client data, and content your company uploads or generates using the service. We own the Inbox Sales Copilot software itself.</p>
        <p>By uploading documents, client data, and content to the service, you grant us a worldwide, non-exclusive, royalty-free license to host, process, and analyze your data solely for the purpose of providing and improving the service for your company.</p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: <p>To the maximum extent permitted by law, Inbox Sales Copilot shall not be liable for any indirect, incidental, special, or consequential damages, or any loss of profits or revenue, arising from incorrect AI-generated suggestions or the use of the service. Our total liability for any claim under these terms is limited to the amount paid by you to us in the twelve (12) months preceding the event giving rise to liability.</p>,
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <>
        <p>Your company's administrator can offboard the account at any time, which immediately revokes every Sales Engineer's access and connected Google authorization.</p>
        <p>Upon termination by either party, your access to the service will be revoked immediately. Your company's data will remain stored in our system but will not be accessible. To request manual deletion of your stored data, the company administrator must contact salesbox@support.com within 30 days of termination; otherwise, data may be retained in accordance with our standard retention policies.</p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: <p>We may update these terms from time to time. If we make material changes, we'll notify your company's administrator.</p>,
  },
  {
    id: "contact",
    title: "Contact us",
    body: <p>Questions about these terms can be sent to salesbox@support.com.</p>,
  },
]

export function Terms() {
  return <LegalLayout pageTitle="Terms of Service" lastUpdated="July 18, 2026" sections={sections} />
}
