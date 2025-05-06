'use client';

import { useState } from 'react';

// 13.092391868922656, 103.20396517122114

const TARGET_LOCATION = { lat: 13.092391868922656, lng: 103.20396517122114 };

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
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
        body: JSON.stringify({ name, group, latitude, longitude }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'បានដាក់ស្នើដោយជោគជ័យ!');
        setStatus('success');
        setName('');
        setGroup('');
      } else {
        setMessage(data.message || 'មានបញ្ហាផ្នែក Server');
        setStatus('error');
      }
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">វត្តមានសិក្ខាសាលា</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="ឈ្មោះ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">សូមជ្រើសរើសក្រុម</option>
            <option value="1">ក្រុម 1</option>
            <option value="2">ក្រុម 2</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            ចុះឈ្មោះ
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              status === 'success'
                ? 'text-green-600'
                : status === 'error'
                ? 'text-red-600'
                : 'text-gray-700'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
 