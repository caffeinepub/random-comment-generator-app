// Live List Checker Types - Frontend definitions
// These types are defined here until backend implementation is complete

import type { Principal, Time } from '../backend';

export type ClaimId = string;
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface ClaimRecord {
    id: ClaimId;
    name: string;
    upiId: string;
    claimant: Principal;
    status: ClaimStatus;
    timestamp: Time;
}

export interface LiveListSettings {
    maxClaims: bigint;
    perClaimAmount: bigint;
}

export interface LiveListTotals {
    pendingCount: bigint;
    approvedCount: bigint;
    rejectedCount: bigint;
    pendingTotalAmount: bigint;
    approvedTotalAmount: bigint;
}

export interface ContactInfo {
    whatsappNumber: string;
    email: string;
    additionalInfo: string;
}

// Extended backend interface with Live List Checker methods
export interface LiveListCheckerBackend {
    uploadNameList(accessCode: string, names: Array<string>): Promise<void>;
    getActiveNameList(): Promise<Array<string>>;
    checkNameAvailability(name: string): Promise<boolean>;
    createClaim(name: string, upiId: string): Promise<ClaimId>;
    getClaimStatus(name: string): Promise<ClaimRecord | null>;
    getAllClaims(accessCode: string): Promise<Array<ClaimRecord>>;
    approveClaim(accessCode: string, claimId: ClaimId): Promise<void>;
    rejectClaim(accessCode: string, claimId: ClaimId): Promise<void>;
    getLiveListTotals(accessCode: string): Promise<LiveListTotals>;
    setLiveListSettings(accessCode: string, settings: LiveListSettings): Promise<void>;
    getLiveListSettings(accessCode: string): Promise<LiveListSettings>;
    setContactInfo(accessCode: string, info: ContactInfo): Promise<void>;
    getContactInfo(): Promise<ContactInfo>;
}
