import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHeader, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Copy, 
  Trash2,
  MoreVertical,
  User,
  Mail,
  Building2,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setSessionStatus, cancelSession, duplicateSession, deleteSession } from '@/lib/actions/sessions';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const session = await db.session.findUnique({
    where: { id },
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

  async function handlePublish() {
    'use server';
    await setSessionStatus(id, 'PUBLISHED');
    revalidatePath(`/admin/programme/sessions/${id}`);
  }

  async function handleUnpublish() {
    'use server';
    await setSessionStatus(id, 'DRAFT');
    revalidatePath(`/admin/programme/sessions/${id}`);
  }

  async function handleCancel(formData: FormData) {
    'use server';
    const reason = formData.get('reason') as string;
    await cancelSession(id, reason);
    revalidatePath(`/admin/programme/sessions/${id}`);
  }

  async function handleDuplicate() {
    'use server';
    await duplicateSession(id);
    revalidatePath('/admin/programme/sessions');
  }

  async function handleDelete() {
    'use server';
    await deleteSession(id);
    revalidatePath('/admin/programme/sessions');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.title}
        description={session.subtitle || session.day?.label}
        breadcrumbs={[
          { label: 'Sessions', href: '/admin/programme/sessions' },
          { label: session.sessionCode || 'Session' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={session.publicationStatus} />
            {session.isCancelled && (
              <Badge variant="destructive">Cancelled</Badge>
            )}
            
            <Button variant="outline" asChild>
              <Link href={`/admin/programme/sessions/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {session.publicationStatus === 'DRAFT' && (
                  <DropdownMenuItem>
                    <form action={handlePublish}>
                      <button type="submit" className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Publish
                      </button>
                    </form>
                  </DropdownMenuItem>
                )}
                {session.publicationStatus === 'PUBLISHED' && (
                  <DropdownMenuItem>
                    <form action={handleUnpublish}>
                      <button type="submit" className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Unpublish
                      </button>
                    </form>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <form action={handleDuplicate}>
                    <button type="submit" className="flex items-center">
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </button>
                  </form>
                </DropdownMenuItem>
                {!session.isCancelled && (
                  <DropdownMenuItem className="text-orange-600">
                    <form action={handleCancel}>
                      <button type="submit" className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Cancel Session
                      </button>
                    </form>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive">
                  <form action={handleDelete}>
                    <button type="submit" className="flex items-center">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {session.isCancelled && session.cancellationReason && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              <strong>Cancelled:</strong> {session.cancellationReason}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{session.description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Day</p>
                    <p className="font-medium">{session.day?.label || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{session.startTime} - {session.endTime}</p>
                  </div>
                </div>
              </div>

              {session.sessionType && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Session Type</p>
                  <Badge
                    style={{ 
                      backgroundColor: session.sessionType.color || '#gray',
                      color: session.sessionType.textColor || 'white',
                    }}
                  >
                    {session.sessionType.name}
                  </Badge>
                </div>
              )}

              {session.track && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Track</p>
                  <Badge
                    style={{ 
                      backgroundColor: session.track.color || '#gray',
                      color: session.track.textColor || 'white',
                    }}
                  >
                    {session.track.name}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.isGlobalEvent ? (
                <p className="text-muted-foreground">
                  This is a global event displayed across all rooms
                </p>
              ) : session.rooms.length > 0 ? (
                <div className="space-y-2">
                  {session.rooms.map((sr) => (
                    <div 
                      key={sr.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                    >
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: sr.room.color || '#gray' }}
                      />
                      <div>
                        <p className="font-medium">{sr.room.name}</p>
                        {sr.room.venue && (
                          <p className="text-sm text-muted-foreground">
                            {sr.room.venue.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No room assigned</p>
              )}
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                People ({session.persons.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.persons.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(
                    session.persons.reduce((acc, sp) => {
                      if (!acc[sp.role]) acc[sp.role] = [];
                      acc[sp.role].push(sp);
                      return acc;
                    }, {} as Record<string, typeof session.persons>)
                  ).map(([role, persons]) => (
                    <div key={role}>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {role.charAt(0) + role.slice(1).toLowerCase()}s
                      </p>
                      <div className="space-y-2">
                        {persons.map((sp) => (
                          <div 
                            key={sp.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {sp.person.displayName || `${sp.person.firstName} ${sp.person.lastName}`}
                                </p>
                                {sp.person.organization && (
                                  <p className="text-sm text-muted-foreground">
                                    {sp.person.organization.acronym || sp.person.organization.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            {sp.isConfirmed && (
                              <Badge variant="outline" className="text-green-600">
                                Confirmed
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No people assigned to this session
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {session.sessionCode && (
                <div>
                  <p className="text-muted-foreground">Session Code</p>
                  <p className="font-mono">{session.sessionCode}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Congress</p>
                <p>{session.congress?.title}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{format(session.createdAt, 'd MMM yyyy, HH:mm')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p>{format(session.updatedAt, 'd MMM yyyy, HH:mm')}</p>
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
                <Link href={`/admin/people?sessionId=${id}`}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage People
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/programme/session/${id}`} target="_blank">
                  <Globe className="h-4 w-4 mr-2" />
                  View Public Page
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          {session.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{session.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
