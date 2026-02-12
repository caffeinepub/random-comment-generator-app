import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type CommentId = Text;
  type CommentListId = Text;
  type RatingImageId = Text;
  type MessageId = Text;

  type Comment = {
    id : CommentId;
    content : Text;
    used : Bool;
    timestamp : Time.Time;
  };

  public type RatingImageMetadata = {
    id : RatingImageId;
    uploader : Principal.Principal;
    userName : Text;
    timestamp : Time.Time;
    image : Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    mobileNumber : Text;
    upiDetails : Text;
  };

  public type MessageSide = {
    #user;
    #admin;
  };

  public type Message = {
    id : MessageId;
    side : MessageSide;
    content : Text;
    timestamp : Time.Time;
    isRead : Bool;
  };

  module Comment {
    public func compare(comment1 : Comment, comment2 : Comment) : Order.Order {
      Text.compare(comment1.id, comment2.id);
    };
  };

  // Bulk Generation Log Entry
  type BulkGenLog = {
    id : Text;
    user : Principal.Principal;
    listId : CommentListId;
    numComments : Nat;
    timestamp : Time.Time;
  };

  let commentLists = Map.empty<CommentListId, List.List<Comment>>();
  var commentListIds = List.empty<CommentListId>();
  let bulkGenLogs = Map.empty<Text, BulkGenLog>();
  var bulkGenLogCounter = 0;

  let lockedCommentLists = Map.empty<CommentListId, Bool>();
  var lockedCommentListIds = List.empty<CommentListId>();

  // User Profile Storage (keyed by Principal for proper authorization)
  let userProfiles = Map.empty<Principal.Principal, UserProfile>();
  let walletBalances = Map.empty<Principal.Principal, Nat>();
  let paymentRecords = Map.empty<Principal.Principal, List.List<PaymentRecord>>();

  type PaymentStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type PaymentRecord = {
    id : Text;
    userPrincipal : Principal.Principal;
    amount : Nat;
    status : PaymentStatus;
    timestamp : Time.Time;
  };

  // Password storage (hashed + salted)
  type PasswordEntry = {
    hash : Text;
    salt : Text;
  };

  let passwordStore = Map.empty<Text, PasswordEntry>();

  // Session storage (session token -> Principal)
  type SessionToken = Text;
  let activeSessions = Map.empty<SessionToken, Principal.Principal>();
  var lastResetTimestamp : Time.Time = 0;

  let nonAuthAccessCode = "5676";

  // User Comment History Storage (per device)
  public type DeviceId = Text;
  let userCommentHistory = Map.empty<
    Principal.Principal,
    Map.Map<DeviceId, Map.Map<CommentListId, Bool>>
  >();

  var bulkGeneratorKey : ?Text = null;
  include MixinStorage();

  func assertAdminAccessWithCode(caller : Principal.Principal, accessCode : Text) {
    let isValidCode = accessCode == nonAuthAccessCode;
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isValidCode and not isAdmin) {
      Runtime.trap("Unauthorized: Admin access required. Provide valid access code or admin credentials.");
    };
  };

  func validateBulkGeneratorKey(providedKey : Text) {
    switch (bulkGeneratorKey) {
      case (null) { Runtime.trap("Bulk generator key has not been set. Please contact the administrator.") };
      case (?storedKey) {
        if (providedKey != storedKey) {
          Runtime.trap("Incorrect bulk generator access key");
        };
      };
    };
  };

  func maskKey(key : Text) : Text {
    let keyLength = key.size();
    let visibleChars = 4;
    if (keyLength <= visibleChars) {
      return "*" # key;
    };

    // Ensure safe slicing
    if (keyLength >= visibleChars) {
      let charsArray = key.toArray();
      let lastChars = charsArray.sliceToArray(keyLength - visibleChars, keyLength);
      let maskedSection = Array.repeat('★', keyLength - visibleChars);
      return Text.fromArray(maskedSection) # Text.fromArray(lastChars);
    };

    // Fallback in case of boundary issues
    key;
  };

  public shared ({ caller }) func setBulkGeneratorKey(accessCode : Text, newKey : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    bulkGeneratorKey := ?newKey;
  };

  public shared ({ caller }) func resetBulkGeneratorKey(accessCode : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    bulkGeneratorKey := null;
  };

  public query ({ caller }) func getBulkGeneratorKey(accessCode : Text, masked : Bool) : async ?Text {
    assertAdminAccessWithCode(caller, accessCode);

    switch (bulkGeneratorKey) {
      case (null) { null };
      case (?key) {
        if (masked) {
          ?maskKey(key);
        } else {
          ?key;
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or must be admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getWalletBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view wallet balance");
    };
    switch (walletBalances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
  };

  public shared ({ caller }) func addFundsToWallet(accessCode : Text, userPrincipal : Principal.Principal, amount : Nat) : async () {
    assertAdminAccessWithCode(caller, accessCode);

    let currentBalance = switch (walletBalances.get(userPrincipal)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
    walletBalances.add(userPrincipal, currentBalance + amount);
  };

  public query ({ caller }) func getPaymentHistory() : async [PaymentRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view payment history");
    };
    switch (paymentRecords.get(caller)) {
      case (null) { [] };
      case (?records) { records.toArray() };
    };
  };

  public shared ({ caller }) func updatePaymentStatus(
    accessCode : Text,
    userPrincipal : Principal.Principal,
    paymentId : Text,
    newStatus : PaymentStatus,
  ) : async () {
    assertAdminAccessWithCode(caller, accessCode);

    switch (paymentRecords.get(userPrincipal)) {
      case (null) { Runtime.trap("No payment records found for user") };
      case (?records) {
        let updatedRecords = records.map<PaymentRecord, PaymentRecord>(
          func(record) {
            if (record.id == paymentId) {
              { record with status = newStatus };
            } else {
              record;
            };
          }
        );
        paymentRecords.add(userPrincipal, updatedRecords);
      };
    };
  };

  public query ({ caller }) func getAllPaymentRecords(accessCode : Text) : async [(Principal.Principal, [PaymentRecord])] {
    assertAdminAccessWithCode(caller, accessCode);

    paymentRecords.entries().toArray().map(
      func((userPrincipal, records)) {
        (userPrincipal, records.toArray());
      }
    );
  };

  public shared ({ caller }) func createCommentList(accessCode : Text, listId : CommentListId) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    if (commentLists.containsKey(listId)) {
      Runtime.trap("Comment list already exists");
    };
    commentLists.add(listId, List.empty<Comment>());
    if (not commentListIds.any(func(id) { id == listId })) {
      commentListIds.add(listId);
    };
  };

  public shared ({ caller }) func addComment(accessCode : Text, listId : CommentListId, id : CommentId, content : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    let comment : Comment = {
      id;
      content;
      used = false;
      timestamp = Time.now();
    };
    let existingList = commentLists.get(listId);
    switch (existingList) {
      case (null) {
        let newList = List.fromArray<Comment>([comment]);
        commentLists.add(listId, newList);
        if (not commentListIds.any(func(id) { id == listId })) {
          commentListIds.add(listId);
        };
      };
      case (?comments) {
        comments.add(comment);
      };
    };
  };

  public shared ({ caller }) func removeComment(accessCode : Text, listId : CommentListId, commentId : CommentId) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    switch (commentLists.get(listId)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?comments) {
        let filtered = comments.filter(func(c) { c.id != commentId });
        commentLists.add(listId, filtered);
      };
    };
  };

  public shared ({ caller }) func resetCommentList(accessCode : Text, listId : CommentListId) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    switch (commentLists.get(listId)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?comments) {
        let resetList = comments.map<Comment, Comment>(
          func(comment) {
            { comment with used = false };
          }
        );
        commentLists.add(listId, resetList);
      };
    };
  };

  public shared ({ caller }) func clearAllCommentLists(accessCode : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    commentLists.clear();
    commentListIds.clear();
  };

  public query ({ caller }) func getCommentList(accessCode : Text, listId : CommentListId) : async [Comment] {
    assertAdminAccessWithCode(caller, accessCode);
    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };
    comments.toArray();
  };

  public shared ({ caller }) func deleteCommentList(accessCode : Text, listId : CommentListId) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    if (not commentLists.containsKey(listId)) {
      Runtime.trap("Comment list not found");
    };
    commentLists.remove(listId);
    let filteredIds = commentListIds.filter(func(id) { id != listId });
    commentListIds.clear();
    commentListIds.addAll(filteredIds.values());
  };

  public query ({ caller }) func getCommentListTotal(accessCode : Text, listId : CommentListId) : async Nat {
    assertAdminAccessWithCode(caller, accessCode);
    switch (commentLists.get(listId)) {
      case (null) { 0 };
      case (?comments) { comments.size() };
    };
  };

  public query ({ caller }) func getAllBulkCommentTotals(accessCode : Text) : async [(CommentListId, Nat)] {
    assertAdminAccessWithCode(caller, accessCode);
    let totals = commentLists.entries().toArray().map(
      func((listId, comments)) {
        (listId, comments.size());
      }
    );
    totals;
  };

  public query func getAvailableComments(listId : CommentListId) : async ?[Comment] {
    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };
    let available = comments.toArray().filter(func(c) { not c.used });
    if (available.size() == 0) { null } else { ?available };
  };

  public query ({ caller }) func getLockedCommentListsTotal(accessCode : Text) : async Nat {
    assertAdminAccessWithCode(caller, accessCode);
    lockedCommentListIds.size();
  };

  public query func getLockedCommentListIds() : async [CommentListId] {
    getLockedCommentListIdsInternal();
  };

  func getCommentListIdsInternal() : [CommentListId] {
    commentListIds.toArray().sort();
  };

  func getLockedCommentListIdsInternal() : [CommentListId] {
    lockedCommentListIds.toArray().sort();
  };

  public shared ({ caller }) func lockCommentList(accessCode : Text, listId : CommentListId) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    lockedCommentLists.add(listId, true);
    if (not lockedCommentListIds.any(func(id) { id == listId })) {
      lockedCommentListIds.add(listId);
    };
  };

  public shared ({ caller }) func unlockCommentList(accessCode : Text, listId : CommentListId) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    lockedCommentLists.remove(listId);
    let filteredIds = lockedCommentListIds.filter(func(id) { id != listId });
    lockedCommentListIds.clear();
    lockedCommentListIds.addAll(filteredIds.values());
  };

  public query func isCommentListLocked(listId : CommentListId) : async Bool {
    switch (lockedCommentLists.get(listId)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getRemainingCount(listId : CommentListId) : async Nat {
    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };
    let available = comments.toArray().filter(func(c) { not c.used });
    available.size();
  };

  public query func getCommentListIds() : async [CommentListId] {
    getCommentListIdsInternal();
  };

  public shared ({ caller }) func generateBulkComments(
    bulkGeneratorKey : Text,
    listId : CommentListId,
    count : Nat,
  ) : async [Comment] {
    validateBulkGeneratorKey(bulkGeneratorKey);

    // Check if the comment list is locked
    switch (lockedCommentLists.get(listId)) {
      case (?true) {
        Runtime.trap("Comment list is locked. Cannot generate comments from locked lists.");
      };
      case (_) { /* not locked, proceed */ };
    };

    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };

    let availableArray = comments.toArray().filter(func(c) { not c.used });
    if (availableArray.size() == 0) { return [] };
    let numToGenerate = if (count > availableArray.size()) { availableArray.size() } else { count };

    let selected = availableArray.sliceToArray(0, numToGenerate);

    let updatedComments = comments.map<Comment, Comment>(
      func(comment) {
        let isSelected = selected.any(func(c) { c.id == comment.id });
        if (isSelected) { { comment with used = true } } else { comment };
      }
    );
    commentLists.add(listId, updatedComments);

    bulkGenLogCounter += 1;
    let logId = "bulk_log_" # bulkGenLogCounter.toText();
    let logEntry : BulkGenLog = {
      id = logId;
      user = caller;
      listId;
      numComments = numToGenerate;
      timestamp = Time.now();
    };
    bulkGenLogs.add(logId, logEntry);

    selected;
  };

  // ================== RV Rating Images System (Admin-Only) =====================

  // Maps user names to lists of rating images (RV images)
  let userRatingImages = Map.empty<Text, List.List<RatingImageMetadata>>();
  var ratingImageCounter = 0;

  public shared ({ caller }) func uploadRatingImage(accessCode : Text, userName : Text, image : Storage.ExternalBlob) : async RatingImageId {
    assertAdminAccessWithCode(caller, accessCode);
    ratingImageCounter += 1;
    let imageId = "image_" # ratingImageCounter.toText();
    let ratingImageData : RatingImageMetadata = {
      id = imageId;
      uploader = caller;
      userName;
      timestamp = Time.now();
      image;
    };

    // Add to the corresponding user's list
    let currentList = switch (userRatingImages.get(userName)) {
      case (null) { List.empty<RatingImageMetadata>() };
      case (?existing) { existing };
    };
    currentList.add(ratingImageData);
    userRatingImages.add(userName, currentList);

    imageId;
  };

  public query ({ caller }) func getAllUserRatingImages(accessCode : Text) : async [(Text, [RatingImageMetadata])] {
    assertAdminAccessWithCode(caller, accessCode);

    userRatingImages.entries().toArray().map(
      func((userName, ratings)) {
        (userName, ratings.toArray());
      }
    );
  };

  public query ({ caller }) func getUserRatingImageCount(accessCode : Text, userName : Text) : async Nat {
    assertAdminAccessWithCode(caller, accessCode);

    switch (userRatingImages.get(userName)) {
      case (null) { 0 };
      case (?ratings) { ratings.size() };
    };
  };

  public query ({ caller }) func getTotalUserRatingCount(accessCode : Text) : async Nat {
    assertAdminAccessWithCode(caller, accessCode);

    var total = 0;
    for ((_, ratings) in userRatingImages.entries()) {
      total += ratings.size();
    };
    total;
  };

  public query ({ caller }) func downloadAllRatingImages(accessCode : Text) : async [RatingImageMetadata] {
    assertAdminAccessWithCode(caller, accessCode);

    var allImages = List.empty<RatingImageMetadata>();
    for ((_, ratings) in userRatingImages.entries()) {
      allImages.addAll(ratings.values());
    };
    allImages.toArray();
  };

  public shared ({ caller }) func removeRatingImage(accessCode : Text, userName : Text, imageId : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);

    switch (userRatingImages.get(userName)) {
      case (null) { Runtime.trap("No rating images found for user") };
      case (?ratings) {
        let filtered = ratings.filter(func(r) { r.id != imageId });
        userRatingImages.add(userName, filtered);
      };
    };
  };

  public shared ({ caller }) func removeAllUserRatingImages(accessCode : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    userRatingImages.clear();
  };

  // ================== Messaging System =====================

  let messages = Map.empty<MessageId, Message>();
  var messageCounter = 0;

  public shared ({ caller }) func sendMessage(content : Text) : async MessageId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can send messages");
    };

    let messageId = "msg_" # messageCounter.toText();
    messageCounter += 1;
    let message : Message = {
      id = messageId;
      side = #user;
      content;
      timestamp = Time.now();
      isRead = false;
    };
    messages.add(messageId, message);
    messageId;
  };

  public shared ({ caller }) func replyMessage(accessCode : Text, replyContent : Text) : async MessageId {
    assertAdminAccessWithCode(caller, accessCode);

    let messageId = "msg_" # messageCounter.toText();
    messageCounter += 1;
    let message : Message = {
      id = messageId;
      side = #admin;
      content = replyContent;
      timestamp = Time.now();
      isRead = false;
    };
    messages.add(messageId, message);
    messageId;
  };

  public query ({ caller }) func getAllMessages(accessCode : Text) : async [Message] {
    assertAdminAccessWithCode(caller, accessCode);
    messages.values().toArray();
  };

  public query ({ caller }) func getMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view messages");
    };
    messages.values().toArray();
  };
};
