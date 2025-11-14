'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteOrder } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Order = {
  id: string
  order_number: string | null
  customer_name: string | null
  customer_email: string | null
  status: string | null
  city: string | null
  created_at: string
  admin: { email: string; display_name: string | null } | null
  route: { id: string; name: string | null; status: string | null } | null
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()

  const handleDelete = async (order: Order) => {
    if (!confirm(`Delete order ${order.order_number || order.id}?`)) return

    try {
      await deleteOrder(order.id)
      toast.success('Order deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete order')
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default">Delivered</Badge>
      case 'in_transit':
        return <Badge>In Transit</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-sm">
                {order.order_number || order.id.slice(0, 8)}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{order.customer_name || '-'}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_email || '-'}</div>
                </div>
              </TableCell>
              <TableCell>{order.city || '-'}</TableCell>
              <TableCell>
                {order.admin ? (order.admin.display_name || order.admin.email) : '-'}
              </TableCell>
              <TableCell>
                {order.route ? (
                  <Badge variant="outline">{order.route.name || `Route ${order.route.id.slice(0, 8)}`}</Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-sm">
                {new Date(order.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(order)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
