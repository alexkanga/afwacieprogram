import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Globe, 
  Palette,
  Plus,
  ExternalLink,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

export default async function CongressDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const congress = await db.congress.findUnique({
    where: { id },
    include: {
      venues: {
        include: {
          rooms: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { isPrimary: 'desc' },
      },
      programDays: {
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { sessions: true } },
        },
      },
      tracks: {
        orderBy: { displayOrder: 'asc' },
      },
      sessionTypes: {
        orderBy: { displayOrder: 'asc' },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  });

  if (!congress) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={congress.title}
        description={congress.description || `${congress.year} Congress`}
        breadcrumbs={[
          { label: 'Congresses', href: '/admin/congresses' },
          { label: congress.shortName || congress.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={congress.status} />
            <Button variant="outline" asChild>
              <Link href={`/admin/congresses/${congress.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-muted-foreground">
                      {format(congress.startDate, 'EEEE, d MMMM yyyy')} - {format(congress.endDate, 'EEEE, d MMMM yyyy')}
                    </p>
                  </div>
                </div>
                
                {(congress.city || congress.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {[congress.city, congress.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                
                {congress.venueName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-sm text-muted-foreground">{congress.venueName}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Timezone</p>
                    <p className="text-sm text-muted-foreground">{congress.timezone}</p>
                  </div>
                </div>
              </div>

              {congress.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{congress.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Program Days */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Program Days</CardTitle>
                <CardDescription>{congress.programDays.length} days scheduled</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/admin/programme/days?congressId=${congress.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Day
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {congress.programDays.length > 0 ? (
                <div className="space-y-2">
                  {congress.programDays.map((day) => (
                    <div 
                      key={day.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{day.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(day.date, 'd MMMM yyyy')}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {day._count.sessions} sessions
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No program days yet.</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href={`/admin/programme/days?congressId=${congress.id}`}>
                      Generate program days
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rooms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Venues & Rooms</CardTitle>
                <CardDescription>
                  {congress.venues.length} venues, {congress.venues.reduce((acc, v) => acc + v.rooms.length, 0)} rooms
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/admin/programme/rooms?congressId=${congress.id}`}>
                  Manage Rooms
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {congress.venues.length > 0 ? (
                <div className="space-y-4">
                  {congress.venues.map((venue) => (
                    <div key={venue.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{venue.name}</h4>
                        {venue.isPrimary && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {venue.rooms.map((room) => (
                          <span 
                            key={room.id}
                            className="px-2 py-1 text-sm rounded bg-muted"
                            style={room.color ? { backgroundColor: room.color + '20', borderColor: room.color } : undefined}
                          >
                            {room.name}
                            {room.isPlenary && ' (Plenary)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No venues configured.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{congress._count.sessions}</p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{congress.programDays.length}</p>
                  <p className="text-sm text-muted-foreground">Days</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{congress.tracks.length}</p>
                  <p className="text-sm text-muted-foreground">Tracks</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">
                    {congress.venues.reduce((acc, v) => acc + v.rooms.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/admin/programme/sessions?congressId=${congress.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Sessions
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/admin/people?congressId=${congress.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage People
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/admin/imports?congressId=${congress.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Import Data
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Branding */}
          {(congress.primaryColor || congress.logoUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Branding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {congress.primaryColor && (
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: congress.primaryColor }}
                    />
                  )}
                  {congress.secondaryColor && (
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: congress.secondaryColor }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
