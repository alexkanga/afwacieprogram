import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, ChevronRight, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default async function ProgrammePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; view?: string }>;
}) {
  const params = await searchParams;
  
  // Get current congress
  const congress = await db.congress.findFirst({
    where: {
      isCurrent: true,
      status: 'PUBLISHED',
    },
    include: {
      programDays: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
      venues: {
        include: {
          rooms: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      },
    },
  });

  if (!congress) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Programme Available</h1>
            <p className="text-muted-foreground">
              The congress programme has not been published yet. Please check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get sessions for the selected day or first day
  const selectedDayId = params.day || congress.programDays[0]?.id;
  
  const sessions = selectedDayId ? await db.session.findMany({
    where: {
      dayId: selectedDayId,
      publicationStatus: 'PUBLISHED',
      isCancelled: false,
    },
    include: {
      sessionType: true,
      track: true,
      rooms: { include: { room: true } },
      persons: {
        include: { person: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { startTime: 'asc' },
  }) : [];

  // Get rooms for grid view
  const rooms = congress.venues.flatMap(v => v.rooms);

  // Group sessions by time
  const timeSlots = sessions.reduce((acc, session) => {
    const time = session.startTime;
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  const sortedTimes = Object.keys(timeSlots).sort();

  return (
    <div className="container py-8">
      {/* Congress Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{congress.title}</h1>
        <p className="text-muted-foreground">
          {format(congress.startDate, 'd MMMM')} - {format(congress.endDate, 'd MMMM yyyy')}
          {congress.city && ` • ${congress.city}`}
          {congress.country && `, ${congress.country}`}
        </p>
      </div>

      {/* Day Tabs */}
      <Tabs defaultValue={selectedDayId} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            {congress.programDays.map((day, index) => (
              <TabsTrigger key={day.id} value={day.id} asChild>
                <Link href={`/programme?day=${day.id}`}>
                  Day {index + 1}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {congress.programDays.map((day) => (
          <TabsContent key={day.id} value={day.id}>
            {day.id === selectedDayId && (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{day.label}</h2>
                </div>

                {/* Grid View */}
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header Row */}
                    <div className="grid gap-2 mb-4" style={{ 
                      gridTemplateColumns: '100px ' + rooms.map(() => '1fr').join(' ')
                    }}>
                      <div className="font-medium text-sm text-muted-foreground p-2">
                        Time
                      </div>
                      {rooms.map((room) => (
                        <div 
                          key={room.id}
                          className="font-medium text-sm p-2 text-center rounded bg-muted/50"
                          style={{ 
                            backgroundColor: room.color ? `${room.color}20` : undefined,
                            borderLeft: room.color ? `3px solid ${room.color}` : undefined,
                          }}
                        >
                          {room.name}
                        </div>
                      ))}
                    </div>

                    {/* Time Slots */}
                    {sortedTimes.map((time) => (
                      <div 
                        key={time}
                        className="grid gap-2 mb-2"
                        style={{ 
                          gridTemplateColumns: '100px ' + rooms.map(() => '1fr').join(' ')
                        }}
                      >
                        <div className="text-sm text-muted-foreground p-2 font-medium">
                          {time}
                        </div>
                        
                        {rooms.map((room) => {
                          const roomSessions = timeSlots[time].filter(s => 
                            s.rooms.some(r => r.roomId === room.id) ||
                            s.isGlobalEvent ||
                            s.roomDisplayMode === 'ALL_ROOMS'
                          );
                          
                          const session = roomSessions[0];
                          
                          if (!session) {
                            return (
                              <div 
                                key={room.id}
                                className="min-h-[60px] border rounded bg-muted/20"
                              />
                            );
                          }

                          const bgColor = session.colorOverride || 
                            session.track?.color || 
                            session.sessionType?.color || '#gray';
                          
                          const textColor = session.textColorOverride ||
                            session.track?.textColor ||
                            session.sessionType?.textColor || 'white';

                          return (
                            <Link 
                              key={`${time}-${room.id}`}
                              href={`/programme/session/${session.id}`}
                              className="block"
                            >
                              <Card 
                                className="min-h-[60px] cursor-pointer hover:shadow-md transition-shadow"
                                style={{ 
                                  backgroundColor: bgColor,
                                  color: textColor,
                                }}
                              >
                                <CardContent className="p-2">
                                  <p className="font-medium text-sm line-clamp-2">
                                    {session.title}
                                  </p>
                                  {session.persons.length > 0 && (
                                    <p className="text-xs mt-1 opacity-80 line-clamp-1">
                                      {session.persons.slice(0, 2).map(p => 
                                        p.person.displayName || `${p.person.firstName} ${p.person.lastName}`
                                      ).join(', ')}
                                      {session.persons.length > 2 && '...'}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    ))}

                    {sortedTimes.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No sessions scheduled for this day</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
