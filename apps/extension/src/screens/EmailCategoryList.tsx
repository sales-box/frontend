import { ArrowLeft, Inbox } from 'lucide-react'
import { PanelHeader } from '../components/PanelHeader'
import { Badge } from '../components/Badge'

export interface EmailRowData {
  threadId: string
  clientName: string
  company: string
  subjectSnippet: string
  timestamp: string
  status?: 'ready' | 'needs-review' | 'manual'
}

interface EmailCategoryListProps {
  category: string
  emails?: EmailRowData[]
  onBack: () => void
  onSelectEmail: (threadId: string) => void
  onClose: () => void
}

export function EmailCategoryList({ category, emails = [], onBack, onSelectEmail, onClose }: EmailCategoryListProps) {
  // Format the category name for display
  const displayCategory = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <PanelHeader onClose={onClose} />

      {/* Subheader with back button */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <button 
          onClick={onBack}
          className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-body font-semibold text-[var(--color-text-primary)]">{displayCategory}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center text-[var(--color-text-tertiary)]">
            <Inbox size={32} className="mb-4 opacity-20" />
            <p className="text-body">No emails found in this category.</p>
            {/* TODO(AI-pipeline): replace N/A once GET /emails/categorized exists */}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {emails.map((email) => (
              <button
                key={email.threadId}
                onClick={() => onSelectEmail(email.threadId)}
                className="w-full text-left p-4 hover:bg-[var(--color-surface-tertiary)] transition-colors cursor-pointer flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-semibold text-[var(--color-text-primary)]">
                      {email.clientName}
                    </span>
                    <span className="text-small text-[var(--color-text-secondary)]">
                      {email.company}
                    </span>
                  </div>
                  <span className="text-caption text-[var(--color-text-tertiary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {email.timestamp}
                  </span>
                </div>
                
                <div className="text-small text-[var(--color-text-secondary)] line-clamp-1">
                  {email.subjectSnippet}
                </div>

                <div className="flex items-center justify-start mt-1">
                  {email.status === 'ready' ? (
                    <Badge variant="success">Ready</Badge>
                  ) : email.status === 'needs-review' ? (
                    <Badge variant="warning">Review</Badge>
                  ) : email.status === 'manual' ? (
                    <Badge variant="danger">Manual</Badge>
                  ) : (
                    <Badge variant="muted">Not reviewed</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
