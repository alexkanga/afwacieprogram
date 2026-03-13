import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User,
  Building2,
  ArrowLeft,
  Share2,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function PublicSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const session = await db.session.findUnique({
    where: { 
      id,
      publicationStatus: 'PUBLISHED',
      isCancelled: false,
    },
    include: {
      congress: true,
      day: true,
      sessionType: true,
      track: true,
      rooms: {
        include: { room: { include: { venue: true } } },
      },
      persons: {
        include: { 
          person: { 
            include: { organization: true } 
          } 
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!session) {
    notFound();
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Back Link */}
      <Link 
        href="/programme" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Programme
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {session.sessionType && (
            <Badge
              style={{ 
                backgroundColor: session.sessionType.color || '#gray',
                color: session.sessionType.textColor || 'white',
              }}
            >
              {session.sessionType.name}
            </Badge>
          )}
          {session.track && (
            <Badge
              variant="outline"
              style={{ 
                borderColor: session.track.color || '#gray',
                color: session.track.color,
              }}
            >
              {session.track.name}
            </Badge>
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
        {session.subtitle && (
          <p className="text-xl text-muted-foreground">{session.subtitle}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule & Location */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-muted-foreground">{session.day?.label}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-muted-foreground">{session.startTime} - {session.endTime}</p>
                  </div>
                </div>
                
                {!session.isGlobalEvent && session.rooms.length > 0 && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">
                        {session.rooms.map(sr => sr.room.name).join(', ')}
                      </p>
                      {session.rooms[0]?.room.venue && (
                        <p className="text-sm text-muted-foreground">
                          {session.rooms[0].room.venue.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {session.description && (
            <Card>
              <CardHeader>
                <CardTitle>About this Session</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{session.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Speakers & Participants */}
          {session.persons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(
                    session.persons.reduce((acc, sp) => {
                      if (!acc[sp.role]) acc[sp.role] = [];
                      acc[sp.role].push(sp);
                      return acc;
                    }, {} as Record<string, typeof session.persons>)
                  ).map(([role, persons]) => (
                    <div key={role}>
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        {role.charAt(0) + role.slice(1).toLowerCase()}s
                      </p>
                      <div className="space-y-3">
                        {persons.map((sp) => (
                          <div 
                            key={sp.id}
                            className="flex items-start gap-4 p-4 rounded-lg bg-muted"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {sp.person.displayName || `${sp.person.firstName} ${sp.person.lastName}`}
                              </p>
                              {sp.person.title && (
                                <p className="text-sm text-muted-foreground">{sp.person.title}</p>
                              )}
                              {sp.person.organization && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <Building2 className="h-3 w-3" />
                                  {sp.person.organization.name}
                                  {sp.person.country && ` • ${sp.person.country}`}
                                </p>
                              )}
                              {sp.person.bio && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                  {sp.person.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Congress Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{session.congress?.title}</CardTitle>
              <CardDescription>
                {format(session.congress?.startDate || new Date(), 'd MMM')} - {format(session.congress?.endDate || new Date(), 'd MMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/programme">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Programme
                </Link>
              </Button>
              <Button className="w-full" variant="ghost">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
