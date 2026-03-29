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

export interface Fournisseur {
    id: number;
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
    nomEntreprise: string;
    infoContact: string;
    image?: string;
    description?: string;
    verified: boolean;
    status?: 'PENDING_APPROVAL' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
    yearEstablished?: number;
    categorie?: string;
}

export interface Produit {
    id: number;
    nom: string;
    description: string;
    image?: string;
    prixUnitaire: number;
    stockDisponible: number;
    quantiteMinimumCommande?: number;
    alerteStock: boolean;
    fournisseurId: number;
    fournisseurNom?: string;
    categorieId?: number;
    categorieNom?: string;
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
    amount?: number;
    platformFee?: number;
    supplierNetAmount?: number;
    paymentMethod?: string;
    paymentStatus?: 'UNPAID' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
    escrowStatus?: 'UNPAID' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
    escrowHeldAt?: string;
    escrowReleasedAt?: string;
    refundedAt?: string;
    refundRequestStatus?: 'NONE' | 'OPEN' | 'RESOLVED' | 'REJECTED';
    refundRequestedAt?: string;
    refundRequestMessage?: string;
    disputeCategory?: string;
    disputeReason?: string;
    disputeRaisedAt?: string;
    supportSupplierId?: number;
    supportSupplierName?: string;
    supportSupplierCompany?: string;
    supportSupplierImage?: string;
    multipleSuppliersInOrder?: boolean;
    invoicePath?: string;
    clientConfirmedAt?: string;
    autoReleaseEligibleAt?: string;
    statut: 'EN_ATTENTE_VALIDATION' | 'VALIDEE' | 'EN_PREPARATION' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE';
    client: {
        id: number;
        nom: string;
        email: string;
        telephone: string;
    };
    lignes: LigneCommande[];
    methodePaiement?: string;
    facturePath?: string;
}

export interface NotificationMsg {
    id: number;
    message: string;
    lue: boolean;
    dateCreation: string;
    commandeId?: number;
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
