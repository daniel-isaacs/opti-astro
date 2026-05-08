export interface FakeUser {
    id: string;
    displayName: string;
    cgUsername: string;
    cgRoles: string[];
}

export const FAKE_USERS: Record<string, FakeUser> = {
    'jane-user': {
        id: 'jane-user',
        displayName: 'Jane User',
        cgUsername: 'daniel.isaacs+restrictedcontent@optimizely.com',
        cgRoles: ['RestrictedContent'],
    },
    'alex-user': {
        id: 'alex-user',
        displayName: 'Alex User',
        cgUsername: 'daniel.isaacs+restrictedcontent@optimizely.com',
        cgRoles: ['RestrictedContent'],
    },
};

export const AUTH_COOKIE_NAME = 'opti_fake_auth';

export function getUserFromCookieValue(value: string): FakeUser | null {
    return FAKE_USERS[value] ?? null;
}
