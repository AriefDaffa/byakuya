import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { query } from '@/lib/db/pool';
import { readLocalAttachment } from '@/features/chat/attachments';
import { uuidSchema } from '@/features/chat/schemas';

export const dynamic = 'force-dynamic';

interface AttachmentLookupRow {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  conversation_id: string;
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[\r\n"\\]/g, '_').trim();
  return cleaned.slice(0, 255) || 'attachment';
}

function notFound() {
  return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return notFound();

  try {
    const attachmentResult = await query<AttachmentLookupRow>(
      `SELECT
         a.id,
         a.file_name,
         a.file_type,
         a.storage_path,
         m.conversation_id
       FROM public.attachments a
       JOIN public.messages m ON m.id = a.message_id
       WHERE a.id = $1`,
      [parsedId.data],
    );

    const attachment = attachmentResult.rows[0];
    if (!attachment) return notFound();

    const membershipResult = await query<{ user_id: string }>(
      `SELECT user_id
       FROM public.conversation_members
       WHERE conversation_id = $1 AND user_id = $2
       LIMIT 1`,
      [attachment.conversation_id, user.id],
    );

    // Treat non-members as not found so attachment ids cannot be probed.
    if (membershipResult.rows.length === 0) return notFound();

    const file = await readLocalAttachment(attachment.storage_path);
    const fileName = sanitizeFileName(attachment.file_name);
    const encodedFileName = encodeURIComponent(attachment.file_name);

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        'Content-Type': attachment.file_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': String(file.byteLength),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return notFound();
  }
}
