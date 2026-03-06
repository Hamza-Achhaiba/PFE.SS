import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    motDePasse: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    nom: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    motDePasse: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['CLIENT', 'FOURNISSEUR']),
    nomEntreprise: z.string().optional(),
    nomMagasin: z.string().optional(),
    adresse: z.string().min(5, 'Address is required'),
    telephone: z.string().min(8, 'Phone is required'),
}).refine(data => {
    if (data.role === 'CLIENT' && (!data.nomMagasin || data.nomMagasin.trim() === '')) return false;
    if (data.role === 'FOURNISSEUR' && (!data.nomEntreprise || data.nomEntreprise.trim() === '')) return false;
    return true;
}, {
    message: "Entreprise/Magasin name is required depending on your role.",
    path: ["role"] // Field to attach the root error to
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
