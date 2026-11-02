// Statically generated at deployment build time.
export const dynamic = 'force-static';
const deployedAt = new Date().toISOString();
export function GET() {
 return Response.json({deployedAt});
}
