'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionCreateSchema } from '@/lib/validations';
import type { z } from 'zod';
import { createSession, getSessionFormData } from '@/lib/actions/sessions';
import { PageHeader, LoadingSpinner } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';

type SessionFormData = z.infer<typeof sessionCreateSchema>;

interface FormDataType {
  congressId: string;
  days: Array<{ id: string; label: string }>;
  rooms: Array<{ id: string; name: string; venueName?: string; color?: string }>;
  tracks: Array<{ id: string; name: string; color?: string; textColor?: string }>;
  sessionTypes: Array<{ id: string; name: string; color?: string; textColor?: string }>;
}

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Form data
  const [formData, setFormData] = useState<FormDataType | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSessionFormData();
        if (!data) {
          toast.error('No active congress found');
          router.push('/admin/congresses');
          return;
        }
        setFormData(data);
        setLoadingData(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load form data');
        setLoadingData(false);
      }
    }
    loadData();
  }, [router]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SessionFormData>({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: {
      congressId: '',
      dayId: searchParams.get('dayId') || '',
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      roomDisplayMode: 'SINGLE_ROOM',
      isGlobalEvent: false,
      publicationStatus: 'DRAFT',
      roomIds: [],
      persons: [],
    },
  });

  // Update congressId when loaded
  useEffect(() => {
    if (formData?.congressId) {
      setValue('congressId', formData.congressId);
    }
  }, [formData?.congressId, setValue]);

  const selectedRoomIds = watch('roomIds') || [];
  const isGlobalEvent = watch('isGlobalEvent');
  const roomDisplayMode = watch('roomDisplayMode');

  const onSubmit = async (data: SessionFormData) => {
    if (!formData?.congressId) {
      toast.error('No active congress');
      return;
    }

    setLoading(true);
    try {
      const result = await createSession({ ...data, congressId: formData.congressId });
      if (result.success && result.data) {
        toast.success('Session created successfully');
        router.push(`/admin/programme/sessions/${result.data.id}`);
      } else {
        if ('conflicts' in result && result.conflicts) {
          toast.error(`${result.error}: ${result.conflicts.map((c: { message: string }) => c.message).join(', ')}`);
        } else {
          toast.error(result.error || 'Failed to create session');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData || !formData) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading form..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="New Session"
        description="Create a new session in the program"
        breadcrumbs={[
          { label: 'Sessions', href: '/admin/programme/sessions' },
          { label: 'New' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Session title..."
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                placeholder="Optional subtitle..."
                {...register('subtitle')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Session description..."
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sessionTypeId">Session Type</Label>
                <Select onValueChange={(value) => setValue('sessionTypeId', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.sessionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className="flex items-center gap-2">
                          {type.color && (
                            <span 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: type.color }}
                            />
                          )}
                          {type.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackId">Track</Label>
                <Select onValueChange={(value) => setValue('trackId', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select track..." />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        <span className="flex items-center gap-2">
                          {track.color && (
                            <span 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: track.color }}
                            />
                          )}
                          {track.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dayId">Day *</Label>
              <Select 
                onValueChange={(value) => setValue('dayId', value)}
                defaultValue={searchParams.get('dayId') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day..." />
                </SelectTrigger>
                <SelectContent>
                  {formData.days.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dayId && <p className="text-sm text-destructive">{errors.dayId.message}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Room Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isGlobalEvent"
                checked={isGlobalEvent}
                onCheckedChange={(checked) => {
                  setValue('isGlobalEvent', checked);
                  if (checked) {
                    setValue('roomDisplayMode', 'ALL_ROOMS');
                  }
                }}
              />
              <Label htmlFor="isGlobalEvent">
                Global Event (all rooms / no specific room)
              </Label>
            </div>

            {!isGlobalEvent && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="roomDisplayMode">Display Mode</Label>
                  <Select 
                    onValueChange={(value: 'SINGLE_ROOM' | 'MULTI_ROOM') => setValue('roomDisplayMode', value)}
                    defaultValue="SINGLE_ROOM"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_ROOM">Single Room</SelectItem>
                      <SelectItem value="MULTI_ROOM">Multiple Rooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Room{roomDisplayMode === 'MULTI_ROOM' ? 's' : ''} *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {formData.rooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          const current = selectedRoomIds;
                          if (roomDisplayMode === 'SINGLE_ROOM') {
                            setValue('roomIds', [room.id]);
                          } else {
                            if (current.includes(room.id)) {
                              setValue('roomIds', current.filter(id => id !== room.id));
                            } else {
                              setValue('roomIds', [...current, room.id]);
                            }
                          }
                        }}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedRoomIds.includes(room.id)
                            ? 'border-primary bg-primary/10'
                            : 'hover:border-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {room.color && (
                            <span 
                              className="w-3 h-3 rounded shrink-0" 
                              style={{ backgroundColor: room.color }}
                            />
                          )}
                          <p className="font-medium">{room.name}</p>
                        </div>
                        {room.venueName && (
                          <p className="text-xs text-muted-foreground mt-1">{room.venueName}</p>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.roomIds && <p className="text-sm text-destructive">{errors.roomIds.message}</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Session
          </Button>
        </div>
      </form>
    </div>
  );
}
