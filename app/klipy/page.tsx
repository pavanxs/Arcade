'use client';

import React, { useState, useEffect } from 'react';
import { fetchTrendingGifs, type GifData } from '@/lib/klipy';

export default function KlipyPage() {
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGifs = async () => {
      try {
        const gifData = await fetchTrendingGifs(1, 10, 'en');
        setGifs(gifData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch GIFs');
        console.error('Error fetching GIFs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGifs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-gray-200 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trending GIFs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-red-600 dark:text-red-400">
            Error Loading GIFs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Make sure your .env file contains:
          </p>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 text-left">
            {`KLIPY_API_KEY="your_api_key_here"
KLIPY_CUSTOMER_ID=your_customer_id_here`}
          </pre>
          <p className="text-xs text-gray-400 mt-2">
            Check that the API key is properly quoted and the customer ID is correct.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
          Trending GIFs from Klipy
        </h1>

        {gifs.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">No GIFs found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifs.map((gif) => (
              <div key={gif.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4">
                  <img
                    src={gif.gif}
                    alt={gif.title || 'GIF'}
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                  />
                  {gif.title && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                      {gif.title}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Powered by Klipy API 🐱
          </p>
        </div>
      </div>
    </div>
  );
}