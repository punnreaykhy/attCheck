'use client';

import {
  Command,
  CommandInput,
  CommandItem,
  CommandEmpty,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const TARGET_LOCATION = { lat: 13.091911551022765, lng: 103.2075473346607 };

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Home() {
  const [group, setGroup] = useState('');
  const [students, setStudents] = useState<{ name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchStudents = async () => {
      if (!group) return;

      const { data, error } = await supabase
        .from('students')
        .select('name')
        .eq('group', parseInt(group));

      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
        setSelectedStudent(null);
      }
    };

    fetchStudents();
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('សូមរង់ចាំ...');

    if (!navigator.geolocation) {
      setMessage('Browser របស់អ្នកមិនគាំទ្រ geolocation ទេ។');
      setStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const distance = getDistanceFromLatLonInMeters(
        latitude,
        longitude,
        TARGET_LOCATION.lat,
        TARGET_LOCATION.lng
      );

      if (distance > 50) {
        setMessage('អ្នកនៅឆ្ងាយពីទីតាំងចុះឈ្មោះ!!');
        setStatus('error');
        return;
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedStudent,
          group,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'បានដាក់ស្នើដោយជោគជ័យ!');
        setStatus('success');
        setGroup('');
        setSelectedStudent(null);
        setStudents([]);
      } else {
        setMessage(data.message || 'មានបញ្ហាផ្នែក Server');
        setStatus('error');
      }
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center dark:text-white">វត្តមានសិក្ខាសាលា</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">សូមជ្រើសរើសក្រុម</option>
            <option value="1">ក្រុម 1</option>
            <option value="2">ក្រុម 2</option>
          </select>

          {group && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedStudent || 'ជ្រើសរើសឈ្មោះ'}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="ស្វែងរកឈ្មោះ..." />
                  <CommandEmpty>រកមិនឃើញ</CommandEmpty>
                  <CommandList>
                    {students.map((student, idx) => (
                      <CommandItem
                        key={idx}
                        value={student.name}
                        onSelect={(value) => {
                          setSelectedStudent(value);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedStudent === student.name ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {student.name}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            disabled={!selectedStudent}
          >
            ចុះឈ្មោះ
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              status === 'success'
                ? 'text-green-500'
                : status === 'error'
                ? 'text-red-500'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
