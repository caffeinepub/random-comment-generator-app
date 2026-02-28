import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface LiveRatingListEntry {
    id: string;
    status: boolean;
    name: string;
}
export interface Comment {
    id: string;
    content: string;
    used: boolean;
    isAdminComment: boolean;
}
export type Principal = Principal;
export interface AccessKey {
    key: string;
    description: string;
}
export interface RatingImage {
    id: string;
    userName: string;
    timestamp: Time;
    uploader: Principal;
    image: ExternalBlob;
}
export type AccessCode = string;
export type BulkKey = string;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBulkComments(commentsArray: Array<string>): Promise<void>;
    addLiveRatingListEntry(id: string, name: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkLiveNameExists(name: string): Promise<boolean>;
    createAccessKey(description: string, key: string): Promise<void>;
    createAdminAccessCode(): Promise<AccessCode>;
    deleteAccessKey(key: string): Promise<void>;
    deleteLiveRatingListEntry(id: string): Promise<void>;
    generateAdminOnlyComments(txt: string, adminCommentsEnabled: boolean): Promise<boolean>;
    generateAiComments(commentCount: bigint, commentLength: bigint): Promise<Array<[string, string]>>;
    generateBulkAccessKeys(keyCount: bigint): Promise<Array<BulkKey>>;
    generateUserComments(customerComments: Array<string>): Promise<boolean>;
    getAccessCodesForAdmin(): Promise<Array<AccessCode>>;
    getAccessKeys(): Promise<Array<AccessKey>>;
    getAllKeys(): Promise<{
        adminAccessCodes: Array<AccessCode>;
        bulkKeysActive: Array<BulkKey>;
        bulkKeysDisabled: Array<BulkKey>;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentStats(): Promise<[bigint, bigint, bigint]>;
    getComments(): Promise<Array<Comment>>;
    getImages(): Promise<Array<RatingImage>>;
    getLiveRatingListEntries(): Promise<Array<LiveRatingListEntry>>;
    getNextUnusedComment(): Promise<Comment>;
    getOtherComments(): Promise<Array<Comment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAccessKey(key: string, newDescription: string, newKey: string): Promise<void>;
    updateLiveRatingListEntryStatus(id: string, status: boolean): Promise<void>;
    uploadImage(file: ExternalBlob): Promise<boolean>;
    useAdminAccessCode(accessCode: AccessCode): Promise<boolean>;
    useBulkAccessKey(bulkKey: BulkKey): Promise<boolean>;
    validateAccessKey(key: string): Promise<boolean>;
}
