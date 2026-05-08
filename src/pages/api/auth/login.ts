import type { APIRoute } from 'astro';
import { AUTH_COOKIE_NAME, FAKE_USERS } from '../../../lib/fake-auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const body = await request.formData();
    const userId = body.get('userId')?.toString();

    if (!userId || !FAKE_USERS[userId]) {
        return new Response('Invalid user', { status: 400 });
    }

    cookies.set(AUTH_COOKIE_NAME, userId, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    const redirectTo = body.get('redirect')?.toString() || '/';
    return redirect(redirectTo, 302);
};
