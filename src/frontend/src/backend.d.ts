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
export type DeviceId = string;
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
    timestamp: Time;
    uploader: Principal;
    image: ExternalBlob;
}
export type Principal = Principal;
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
    name: string;
}
export enum MessageSide {
    admin = "admin",
    user = "user"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(listId: CommentListId, id: CommentId, content: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAllCommentLists(accessCode: string): Promise<void>;
    createCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    deleteCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    generateBulkComments(bulkGeneratorKey: string, listId: CommentListId, count: bigint): Promise<Array<Comment>>;
    generateComment(listId: CommentListId, deviceId: DeviceId): Promise<Comment | null>;
    getAllBulkCommentTotals(accessCode: string): Promise<Array<[CommentListId, bigint]>>;
    getAllMessages(accessCode: string): Promise<Array<Message>>;
    getAllRatingImages(accessCode: string): Promise<Array<RatingImageMetadata>>;
    getAvailableComments(listId: CommentListId): Promise<Array<Comment> | null>;
    getBulkGeneratorKey(accessCode: string, masked: boolean): Promise<string | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentList(accessCode: string, listId: CommentListId): Promise<Array<Comment>>;
    getCommentListIds(): Promise<Array<CommentListId>>;
    getCommentListTotal(accessCode: string, listId: CommentListId): Promise<bigint>;
    getMessages(): Promise<Array<Message>>;
    getRemainingCount(listId: CommentListId): Promise<bigint>;
    getUserCommentHistory(deviceId: DeviceId): Promise<Array<[CommentListId, boolean]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeAllRatingImages(accessCode: string): Promise<void>;
    removeComment(accessCode: string, listId: CommentListId, commentId: CommentId): Promise<void>;
    removeRatingImage(accessCode: string, imageId: string): Promise<void>;
    replyMessage(accessCode: string, replyContent: string): Promise<MessageId>;
    resetBulkGeneratorKey(accessCode: string): Promise<void>;
    resetCommentList(accessCode: string, listId: CommentListId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(content: string): Promise<MessageId>;
    setBulkGeneratorKey(accessCode: string, newKey: string): Promise<void>;
    uploadRatingImage(image: ExternalBlob): Promise<RatingImageId>;
}
