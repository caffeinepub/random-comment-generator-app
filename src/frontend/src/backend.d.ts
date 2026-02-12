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
export type CommentId = string;
export type Time = bigint;
export interface Comment {
    id: CommentId;
    content: string;
    used: boolean;
    timestamp: Time;
}
export interface RatingImageMetadata {
    id: RatingImageId;
    userName: string;
    timestamp: Time;
    uploader: Principal;
    image: ExternalBlob;
}
export type Principal = Principal;
export interface PaymentRecord {
    id: string;
    status: PaymentStatus;
    userPrincipal: Principal;
    timestamp: Time;
    amount: bigint;
}
export type CommentListId = string;
export type MessageId = string;
export interface Message {
    id: MessageId;
    content: string;
    side: MessageSide;
    isRead: boolean;
    timestamp: Time;
}
export type RatingImageId = string;
export interface UserProfile {
    upiDetails: string;
    name: string;
    mobileNumber: string;
    email: string;
}
export enum MessageSide {
    admin = "admin",
    user = "user"
}
export enum PaymentStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(accessCode: string, listId: CommentListId, id: CommentId, content: string): Promise<void>;
    addFundsToWallet(accessCode: string, userPrincipal: Principal, amount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAllCommentLists(accessCode: string): Promise<void>;
    createCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    deleteCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    downloadAllRatingImages(accessCode: string): Promise<Array<RatingImageMetadata>>;
    generateBulkComments(bulkGeneratorKey: string, listId: CommentListId, count: bigint): Promise<Array<Comment>>;
    getAllBulkCommentTotals(accessCode: string): Promise<Array<[CommentListId, bigint]>>;
    getAllMessages(accessCode: string): Promise<Array<Message>>;
    getAllPaymentRecords(accessCode: string): Promise<Array<[Principal, Array<PaymentRecord>]>>;
    getAllUserRatingImages(accessCode: string): Promise<Array<[string, Array<RatingImageMetadata>]>>;
    getAvailableComments(listId: CommentListId): Promise<Array<Comment> | null>;
    getBulkGeneratorKey(accessCode: string, masked: boolean): Promise<string | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentList(accessCode: string, listId: CommentListId): Promise<Array<Comment>>;
    getCommentListIds(): Promise<Array<CommentListId>>;
    getCommentListTotal(accessCode: string, listId: CommentListId): Promise<bigint>;
    getLockedCommentListIds(): Promise<Array<CommentListId>>;
    getLockedCommentListsTotal(accessCode: string): Promise<bigint>;
    getMessages(): Promise<Array<Message>>;
    getPaymentHistory(): Promise<Array<PaymentRecord>>;
    getRemainingCount(listId: CommentListId): Promise<bigint>;
    getTotalUserRatingCount(accessCode: string): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRatingImageCount(accessCode: string, userName: string): Promise<bigint>;
    getWalletBalance(): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    isCommentListLocked(listId: CommentListId): Promise<boolean>;
    lockCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    removeAllUserRatingImages(accessCode: string): Promise<void>;
    removeComment(accessCode: string, listId: CommentListId, commentId: CommentId): Promise<void>;
    removeRatingImage(accessCode: string, userName: string, imageId: string): Promise<void>;
    replyMessage(accessCode: string, replyContent: string): Promise<MessageId>;
    resetBulkGeneratorKey(accessCode: string): Promise<void>;
    resetCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(content: string): Promise<MessageId>;
    setBulkGeneratorKey(accessCode: string, newKey: string): Promise<void>;
    unlockCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    updatePaymentStatus(accessCode: string, userPrincipal: Principal, paymentId: string, newStatus: PaymentStatus): Promise<void>;
    uploadRatingImage(accessCode: string, userName: string, image: ExternalBlob): Promise<RatingImageId>;
}
