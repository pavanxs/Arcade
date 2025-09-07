interface GifData {
  id: string;
  gif: string;
  title?: string;
}

interface TrendingGifsResponse {
  data: GifData[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export async function fetchTrendingGifs(
  page: number = 1,
  perPage: number = 10,
  locale: string = 'en'
): Promise<GifData[]> {
  try {
    // Get API credentials from environment variables
    const appKey = process.env.NEXT_PUBLIC_KLIPY_API_KEY || process.env.KLIPY_API_KEY;
    const customerId = process.env.NEXT_PUBLIC_KLIPY_CUSTOMER_ID || process.env.KLIPY_CUSTOMER_ID;

    if (!appKey || !customerId) {
      throw new Error('Missing Klipy API credentials. Please set KLIPY_API_KEY and KLIPY_CUSTOMER_ID in your .env file');
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow' as RequestRedirect
    };

    const response = await fetch(
      `https://api.klipy.com/api/v1/${appKey}/gifs/trending?page=${page}&per_page=${perPage}&customer_id=${customerId}&locale=${locale}`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const result: TrendingGifsResponse = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching trending GIFs from Klipy:', error);
    throw error;
  }
}

export type { GifData, TrendingGifsResponse };