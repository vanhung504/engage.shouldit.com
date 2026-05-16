const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  return Response.json(
    { apiUrl: 'https://engage.shouldit.com/api', enabled: true },
    { headers: corsHeaders },
  )
}
