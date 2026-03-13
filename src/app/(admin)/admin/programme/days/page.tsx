import { db } from '@/lib/db';
import { PageHeader, PageAction, StatusBadge } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, Plus, MoreVertical, Eye, EyeOff, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { revalidatePath } from 'next/cache';
import { updateProgramDay, deleteProgramDay } from '@/lib/actions/rooms';

export default async function DaysPage() {
  // Get current congress
  const currentCongress = await db.congress.findFirst({
    where: { isCurrent: true },
    include: {
      programDays: {
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { sessions: true } },
        },
      },
    },
  });

  async function togglePublish(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const isPublished = formData.get('isPublished') === 'true';
    await updateProgramDay(id, { isPublished: !isPublished });
    revalidatePath('/admin/programme/days');
  }

  async function deleteDay(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteProgramDay(id);
    revalidatePath('/admin/programme/days');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Days"
        description="Manage the days of your congress program"
        actions={
          <PageAction 
            href="/admin/programme/days/new" 
            icon={Plus} 
            label="Add Day" 
          />
        }
      />

      {!currentCongress ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Congress</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create and activate a congress to manage program days
            </p>
            <Button asChild>
              <Link href="/admin/congresses/new">Create Congress</Link>
            </Button>
          </CardContent>
        </Card>
      ) : currentCongress.programDays.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Program Days</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add program days manually or generate them from congress dates
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/programme/days/new">Add Day</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {currentCongress.programDays.map((day, index) => (
            <Card key={day.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{day.label}</h3>
                        <StatusBadge 
                          status={day.isPublished ? 'PUBLISHED' : 'DRAFT'} 
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(day.date, 'EEEE, d MMMM yyyy')} • {day._count.sessions} sessions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <form action={togglePublish}>
                      <input type="hidden" name="id" value={day.id} />
                      <input type="hidden" name="isPublished" value={String(day.isPublished)} />
                      <Button 
                        type="submit" 
                        variant="ghost" 
                        size="sm"
                      >
                        {day.isPublished ? (
                          <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" /> Publish</>
                        )}
                      </Button>
                    </form>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/programme/days/${day.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/programme/sessions?dayId=${day.id}`}>
                            <Calendar className="h-4 w-4 mr-2" /> View Sessions
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <form action={deleteDay}>
                            <input type="hidden" name="id" value={day.id} />
                            <button type="submit" className="flex items-center">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </button>
                          </form>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
