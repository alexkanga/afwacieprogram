import { db } from '@/lib/db';
import { PageHeader, PageAction } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, MapPin, Users, Edit } from 'lucide-react';
import Link from 'next/link';

export default async function RoomsPage() {
  // Get current congress with venues and rooms
  const currentCongress = await db.congress.findFirst({
    where: { isCurrent: true },
    include: {
      venues: {
        include: {
          rooms: {
            orderBy: { displayOrder: 'asc' },
            include: {
              _count: { select: { sessionRooms: true } },
            },
          },
        },
        orderBy: { isPrimary: 'desc' },
      },
    },
  });

  const totalRooms = currentCongress?.venues.reduce(
    (acc, venue) => acc + venue.rooms.length, 
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Venues & Rooms"
        description="Manage conference venues and session rooms"
        actions={
          <PageAction 
            href="/admin/programme/rooms/new" 
            icon={Plus} 
            label="Add Venue" 
          />
        }
      />

      {!currentCongress ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Congress</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create and activate a congress to manage venues and rooms
            </p>
            <Button asChild>
              <Link href="/admin/congresses/new">Create Congress</Link>
            </Button>
          </CardContent>
        </Card>
      ) : currentCongress.venues.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Venues Configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add a venue and rooms for your sessions
            </p>
            <Button asChild>
              <Link href="/admin/programme/rooms/new">Add Venue</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{currentCongress.venues.length}</p>
                    <p className="text-sm text-muted-foreground">Venues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100 text-green-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalRooms}</p>
                    <p className="text-sm text-muted-foreground">Rooms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {currentCongress.venues.reduce(
                        (acc, v) => acc + v.rooms.filter(r => r.isPlenary).length,
                        0
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Plenary Rooms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Venues */}
          {currentCongress.venues.map((venue) => (
            <Card key={venue.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {venue.name}
                    {venue.isPrimary && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        Primary
                      </span>
                    )}
                  </CardTitle>
                  {venue.city && (
                    <CardDescription>
                      {[venue.address, venue.city, venue.country].filter(Boolean).join(', ')}
                    </CardDescription>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/programme/rooms/${venue.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {venue.rooms.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No rooms configured for this venue
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {venue.rooms.map((room) => (
                      <div 
                        key={room.id}
                        className="p-3 rounded-lg border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: room.color || '#gray' }}
                          />
                          <div>
                            <p className="font-medium">
                              {room.name}
                              {room.isPlenary && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Plenary)
                                </span>
                              )}
                            </p>
                            {room.capacity && (
                              <p className="text-xs text-muted-foreground">
                                Capacity: {room.capacity}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {room._count.sessionRooms} sessions
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
