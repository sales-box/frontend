import { Zap, ShieldCheck, Eye, Hand, Tag } from 'lucide-react'
import { Badge } from './Badge'
import { routingText, type ClassificationInfo, type Routing } from '../lib/routing'

const routingVariant: Record<Routing, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
}

const RoutingIcon = { green: ShieldCheck, yellow: Eye, red: Hand } as const

/**
 * What the AI decided about this email, in one scannable row.
 *
 * Before this the panel rendered nothing about intent, urgency or the
 * supervisor label — a `sensitive + urgent` thread looked identical to a
 * routine pricing question. All three values were already on the wire.
 *
 * Wraps rather than overflows: the panel is narrow and this row sits next to a
 * deal-status badge, so four pills on one line is the normal case, not the edge.
 */
export function ClassificationBar({ routing, intent, isUrgent }: ClassificationInfo) {
  const Icon = RoutingIcon[routing]

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="AI classification">
      <Badge variant={routingVariant[routing]}>
        <Icon size={10} strokeWidth={1.5} aria-hidden="true" />
        {routingText[routing]}
      </Badge>

      {intent && (
        <Badge variant="muted">
          <Tag size={10} strokeWidth={1.5} aria-hidden="true" />
          {intent}
        </Badge>
      )}

      {isUrgent && (
        <Badge variant="danger">
          <Zap size={10} strokeWidth={1.5} aria-hidden="true" />
          Urgent
        </Badge>
      )}
    </div>
  )
}
