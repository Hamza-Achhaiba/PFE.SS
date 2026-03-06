import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
    role?: string;
    exp?: number;
    nom?: string;
    [key: string]: any;
}

export const decodeToken = (token: string): JwtPayload | null => {
    try {
        return jwtDecode<JwtPayload>(token);
    } catch (error) {
        return null;
    }
};

export const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 > Date.now();
};
