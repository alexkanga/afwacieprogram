import { db } from '@/lib/db';
import { PageHeader, PageAction, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar, Search, Filter, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ congressId?: string; dayId?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  
  // Get current congress
  const currentCongress = await db.congress.findFirst({
    where: { isCurrent: true },
    include: {
      programDays: { orderBy: { order: 'asc' } },
      venues: { include: { rooms: true } },
    },
  });

  const congressId = params.congressId || currentCongress?.id;

  // Get sessions
  const sessions = congressId ? await db.session.findMany({
    where: {
      congressId,
      ...(params.dayId && { dayId: params.dayId }),
      ...(params.status && { publicationStatus: params.status as any }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search } },
          { subtitle: { contains: params.search } },
        ],
      }),
    },
    include: {
      day: true,
      sessionType: true,
      track: true,
      rooms: { include: { room: true } },
      persons: {
        include: { person: true },
        orderBy: { sortOrder: 'asc' },
        take: 3,
      },
    },
    orderBy: [
      { day: { order: 'asc' } },
      { startTime: 'asc' },
    ],
    take: 100,
  }) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Manage congress sessions and events"
        actions={
          <PageAction 
            href="/admin/programme/sessions/new" 
            icon={Calendar} 
            label="New Session" 
          />
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  className="pl-10"
                  defaultValue={params.search}
                  name="search"
                />
              </div>
            </div>
            
            {currentCongress && (
              <>
                <Select name="dayId" defaultValue={params.dayId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Days</SelectItem>
                    {currentCongress.programDays.map((day) => (
                      <SelectItem key={day.id} value={day.id}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select name="status" defaultValue={params.status}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            
            <Button type="submit" variant="secondary">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {!currentCongress ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Congress</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create and activate a congress to manage sessions
            </p>
            <Button asChild>
              <Link href="/admin/congresses/new">Create Congress</Link>
            </Button>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first session or import from Excel
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/programme/sessions/new">Create Session</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/imports">Import Excel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Link 
              key={session.id} 
              href={`/admin/programme/sessions/${session.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {session.sessionType && (
                          <span 
                            className="px-2 py-0.5 text-xs rounded"
                            style={{ 
                              backgroundColor: session.sessionType.color || '#gray',
                              color: session.sessionType.textColor || 'white',
                            }}
                          >
                            {session.sessionType.name}
                          </span>
                        )}
                        <StatusBadge status={session.publicationStatus} />
                      </div>
                      
                      <h3 className="font-semibold truncate">{session.title}</h3>
                      
                      {session.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {session.subtitle}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.startTime} - {session.endTime}
                        </div>
                        
                        {session.day && (
                          <span>{session.day.label}</span>
                        )}
                        
                        {session.rooms.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.rooms.map(r => r.room.name).join(', ')}
                          </div>
                        )}
                      </div>
                      
                      {session.persons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {session.persons.map((sp) => (
                            <span 
                              key={sp.id}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted"
                            >
                              {sp.person.displayName || `${sp.person.firstName} ${sp.person.lastName}`}
                              <span className="text-muted-foreground ml-1">
                                ({sp.role.toLowerCase()})
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {session.track && (
                      <span 
                        className="px-2 py-1 text-xs rounded"
                        style={{ 
                          backgroundColor: session.track.color || '#gray',
                          color: session.track.textColor || 'white',
                        }}
                      >
                        {session.track.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
