// utils/fetchWithAuth.ts

export interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
  }
  
  const fetchWithAuth = async <T = any>(url: string, options: FetchOptions = {}): Promise<T> => {
    const token = localStorage.getItem('token');
  
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
  
    return response.json() as Promise<T>;
  };
  
  export default fetchWithAuth;
  