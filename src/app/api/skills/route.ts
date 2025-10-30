import { NextRequest, NextResponse } from 'next/server';

// Redirect to the proper skills endpoint under master-data
// This maintains backward compatibility
export async function GET(request: NextRequest) {
  // Get the full URL to preserve query parameters
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  
  // Redirect to the proper endpoint
  const redirectUrl = `/api/master-data/skills${searchParams ? `?${searchParams}` : ''}`;
  
  // Instead of redirecting, we'll fetch and return the data directly
  // to avoid CORS issues with redirects
  const baseUrl = url.origin;
  const fullUrl = `${baseUrl}${redirectUrl}`;
  
  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error proxying skills request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const baseUrl = url.origin;
  const body = await request.text();
  
  try {
    const response = await fetch(`${baseUrl}/api/master-data/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error proxying skills POST request:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}