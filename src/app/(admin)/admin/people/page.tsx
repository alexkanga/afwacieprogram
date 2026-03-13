import { db } from '@/lib/db';
import { PageHeader, PageAction } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  
  const persons = await db.person.findMany({
    where: params.search
      ? {
          OR: [
            { firstName: { contains: params.search } },
            { lastName: { contains: params.search } },
            { email: { contains: params.search } },
            { displayName: { contains: params.search } },
          ],
        }
      : undefined,
    include: {
      organization: true,
      _count: {
        select: { sessionPersons: true },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Manage speakers, chairs, and participants"
        actions={
          <PageAction 
            href="/admin/people/new" 
            icon={Users} 
            label="Add Person" 
          />
        }
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or organization..."
                className="pl-10"
                defaultValue={params.search}
                name="search"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* People List */}
      {persons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No People Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add people to start assigning them to sessions
            </p>
            <Button asChild>
              <Link href="/admin/people/new">Add Person</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {persons.map((person) => (
            <Link 
              key={person.id} 
              href={`/admin/people/${person.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {getInitials(person.displayName || `${person.firstName} ${person.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {person.displayName || `${person.firstName} ${person.lastName}`}
                      </h3>
                      {person.title && (
                        <p className="text-sm text-muted-foreground">{person.title}</p>
                      )}
                      {person.organization && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {person.organization.acronym || person.organization.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {person.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="h-3 w-3" />
                        {person.email}
                      </p>
                    )}
                    {person.country && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {person.country}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                    {person._count.sessionPersons} session{person._count.sessionPersons !== 1 ? 's' : ''}
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
