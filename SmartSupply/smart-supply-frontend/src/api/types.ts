export interface User {
    id?: number;
    nom: string;
    email: string;
    role: 'CLIENT' | 'FOURNISSEUR';
    nomEntreprise?: string;
    nomMagasin?: string;
    adresse: string;
    telephone: string;
    image?: string;
}

export interface Produit {
    id?: number;
    nom: string;
    description: string;
    image?: string;
    prixUnitaire: number;
    stockDisponible: number;
    quantiteMinimumCommande?: number;
    alerteStock: boolean;
    fournisseurId?: number;
    fournisseurNom?: string; // flattened for UI ease
    categorieId?: number;
    categorie?: string;
    actif: boolean;
}

export interface PanierItem {
    produitId: number;
    quantite: number;
    produit?: Produit;
}

export interface LigneCommande {
    id: number;
    quantite: number;
    sousTotal: number;
    produit: {
        id: number;
        nom: string;
        prix: number;
    };
}

export interface Commande {
    id: number;
    reference?: string;
    trackingReference?: string;
    dateLivraisonEstimee?: string;
    dateCreation: string;
    montantTotal: number;
    statut: 'EN_ATTENTE_VALIDATION' | 'VALIDEE' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE';
    client: {
        id: number;
        nom: string;
        email: string;
        telephone: string;
    };
    lignes: LigneCommande[];
}

export interface NotificationMsg {
    id: number;
    message: string;
    lue: boolean;
    dateCreation: string;
}

export interface LignePanierResponse {
    id: number;
    produitId: number;
    nomProduit: string;
    image: string;
    prixUnitaire: number;
    quantite: number;
    quantiteMinimumCommande?: number;
    sousTotal: number;
}

export interface PanierResponse {
    id: number;
    lignes: LignePanierResponse[];
    montantTotal: number;
}
