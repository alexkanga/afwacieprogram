import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared';
import { 
  Calendar, 
  Building2, 
  Users, 
  FileText, 
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  
  // Get statistics
  const [
    congressCount,
    activeCongress,
    sessionCount,
    publishedSessions,
    personCount,
    organizationCount,
    recentSessions,
  ] = await Promise.all([
    db.congress.count(),
    db.congress.findFirst({ 
      where: { isCurrent: true },
      include: { 
        programDays: { orderBy: { order: 'asc' } },
        venues: { include: { rooms: true } },
      },
    }),
    db.session.count(),
    db.session.count({ where: { publicationStatus: 'PUBLISHED' } }),
    db.person.count(),
    db.organization.count(),
    db.session.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        sessionType: true,
        day: true,
      },
    }),
  ]);

  const stats = [
    { 
      title: 'Congresses', 
      value: congressCount, 
      icon: Building2, 
      href: '/admin/congresses',
      color: 'text-blue-600 bg-blue-100',
    },
    { 
      title: 'Sessions', 
      value: sessionCount, 
      icon: Calendar, 
      href: '/admin/programme/sessions',
      color: 'text-green-600 bg-green-100',
    },
    { 
      title: 'People', 
      value: personCount, 
      icon: Users, 
      href: '/admin/people',
      color: 'text-purple-600 bg-purple-100',
    },
    { 
      title: 'Organizations', 
      value: organizationCount, 
      icon: Building2, 
      href: '/admin/organizations',
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user?.name || 'Administrator'}`}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active Congress Info */}
      {activeCongress ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Active Congress
                </CardTitle>
                <CardDescription>{activeCongress.title}</CardDescription>
              </div>
              <Link
                href={`/admin/congresses/${activeCongress.id}`}
                className="text-sm text-primary hover:underline"
              >
                View Details
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Dates</p>
                <p className="font-medium">
                  {format(activeCongress.startDate, 'd MMM')} - {format(activeCongress.endDate, 'd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program Days</p>
                <p className="font-medium">{activeCongress.programDays.length} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rooms</p>
                <p className="font-medium">
                  {activeCongress.venues.reduce((acc, v) => acc + v.rooms.length, 0)} rooms
                </p>
              </div>
            </div>
            
            {/* Publication Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Publication Progress</p>
                <p className="text-sm font-medium">
                  {sessionCount > 0 
                    ? Math.round((publishedSessions / sessionCount) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ 
                    width: sessionCount > 0 
                      ? `${(publishedSessions / sessionCount) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {publishedSessions} of {sessionCount} sessions published
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Congress</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a congress to start managing your program
            </p>
            <Link
              href="/admin/congresses/new"
              className="text-primary hover:underline"
            >
              Create New Congress
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.day?.label || 'No day assigned'} • {session.startTime} - {session.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.sessionType && (
                      <span 
                        className="px-2 py-1 rounded text-xs"
                        style={{ 
                          backgroundColor: session.sessionType.color || '#gray',
                          color: session.sessionType.textColor || 'white',
                        }}
                      >
                        {session.sessionType.name}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.publicationStatus === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.publicationStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No sessions yet. Create your first session to get started.
            </p>
          )}
          
          {sessionCount > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/admin/programme/sessions"
                className="text-sm text-primary hover:underline"
              >
                View All Sessions →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
