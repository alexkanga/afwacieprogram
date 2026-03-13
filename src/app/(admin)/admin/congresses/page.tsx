import Link from 'next/link';
import { db } from '@/lib/db';
import { PageHeader, PageAction, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, MapPin, Building2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setCongressStatus } from '@/lib/actions/congress';
import { CongressStatus } from '@prisma/client';

async function CongressActions({ congress }: { congress: { id: string; status: string } }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/congresses/${congress.id}`}>View Details</Link>
        </DropdownMenuItem>
        {congress.status === 'DRAFT' && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/congresses/${congress.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        )}
        {congress.status === 'DRAFT' && (
          <form action={async () => {
            'use server';
            await setCongressStatus(congress.id, 'PUBLISHED' as CongressStatus);
          }}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">Publish</button>
            </DropdownMenuItem>
          </form>
        )}
        {congress.status === 'PUBLISHED' && (
          <form action={async () => {
            'use server';
            await setCongressStatus(congress.id, 'ARCHIVED' as CongressStatus);
          }}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">Archive</button>
            </DropdownMenuItem>
          </form>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default async function CongressesPage() {
  const congresses = await db.congress.findMany({
    orderBy: [
      { isCurrent: 'desc' },
      { year: 'desc' },
    ],
    include: {
      _count: {
        select: {
          sessions: true,
          programDays: true,
          venues: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Congresses"
        description="Manage your congress events"
        actions={
          <PageAction href="/admin/congresses/new" icon={Calendar} label="New Congress" />
        }
      />

      {congresses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Congresses Yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first congress to start managing sessions, rooms, and the program schedule.
            </p>
            <PageAction href="/admin/congresses/new" icon={Calendar} label="Create Congress" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {congresses.map((congress) => (
            <Card key={congress.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {congress.title}
                      {congress.isCurrent && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {congress.shortName || congress.year}
                    </CardDescription>
                  </div>
                  <CongressActions congress={congress} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(congress.startDate, 'd MMM')} - {format(congress.endDate, 'd MMM yyyy')}
                    </span>
                  </div>
                  {(congress.city || congress.country) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{[congress.city, congress.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {congress.venueName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{congress.venueName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{congress._count.programDays} days</span>
                    <span>{congress._count.sessions} sessions</span>
                    <span>{congress._count.venues} venues</span>
                  </div>
                  <StatusBadge status={congress.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
