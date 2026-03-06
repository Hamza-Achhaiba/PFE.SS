export interface User {
    id?: number;
    nom: string;
    email: string;
    role: 'CLIENT' | 'FOURNISSEUR';
    nomEntreprise?: string;
    nomMagasin?: string;
    adresse: string;
    telephone: string;
}

export interface Produit {
    id?: number;
    nom: string;
    description: string;
    prixUnitaire: number;
    stockDisponible: number;
    alerteStock: boolean;
    fournisseurId?: number;
    fournisseurNom?: string; // flattened for UI ease
    categorie?: string;
    actif: boolean;
}

export interface PanierItem {
    produitId: number;
    quantite: number;
    produit?: Produit;
}

export interface Commande {
    id: number;
    dateCommande: string;
    clientId: number;
    fournisseurId: number;
    statut: 'EN_ATTENTE' | 'VALIDEE' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE';
    total: number;
    details?: any[];
}

export interface NotificationMsg {
    id: number;
    message: string;
    lue: boolean;
    dateCreation: string;
}
