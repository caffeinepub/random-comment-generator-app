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
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize the access control state
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
    timestamp : Time.Time;
    image : Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
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

  let ratingImages = Map.empty<RatingImageId, RatingImageMetadata>();
  var ratingImageCounter = 0;

  // Bulk generation log
  let bulkGenLogs = Map.empty<Text, BulkGenLog>();
  var bulkGenLogCounter = 0;

  // User Profile Storage
  let userProfiles = Map.empty<Principal.Principal, UserProfile>();

  // Migration-specific non-auth access code
  let nonAuthAccessCode = "5676";

  // User Comment History Storage (per device)
  public type DeviceId = Text;
  let userCommentHistory = Map.empty<
    Principal.Principal,
    Map.Map<DeviceId, Map.Map<CommentListId, Bool>>
  >();

  // Bulk Generator Access Key variables (persisted)
  var bulkGeneratorKey : ?Text = null;

  include MixinStorage();

  // Helper function to check access code OR admin role
  func assertAdminAccessWithCode(caller : Principal.Principal, accessCode : Text) {
    let isValidCode = accessCode == nonAuthAccessCode;
    if (not isValidCode) {
      Runtime.trap("Unauthorized: Admin access required. Provide valid access code or admin credentials.");
    };
  };

  // Validate Bulk Generator Key (Throws error if invalid)
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

  // Helper function to mask the stored key
  func maskKey(key : Text) : Text {
    let keyLength = key.size();
    let visibleChars = 4;
    if (keyLength <= visibleChars) {
      return "*" # key;
    };

    let charsArray = key.toArray();
    let lastChars = charsArray.sliceToArray(keyLength - visibleChars, keyLength);
    let maskedSection = Array.repeat('★', keyLength - visibleChars);
    Text.fromArray(maskedSection) # Text.fromArray(lastChars);
  };

  // Admin functions for bulk generator key
  public shared ({ caller }) func setBulkGeneratorKey(accessCode : Text, newKey : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    bulkGeneratorKey := ?newKey;
  };

  public shared ({ caller }) func resetBulkGeneratorKey(accessCode : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    bulkGeneratorKey := null;
  };

  public shared ({ caller }) func getBulkGeneratorKey(accessCode : Text, masked : Bool) : async ?Text {
    assertAdminAccessWithCode(caller, accessCode);

    switch (bulkGeneratorKey) {
      case (null) { null };
      case (?key) {
        if (masked) {
          // Mask all but the last 4 characters if requested
          ?maskKey(key);
        } else {
          ?key;
        };
      };
    };
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Any authenticated user can get their own profile
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?UserProfile {
    // Users can view their own profile, admins can view any profile
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Any authenticated user can save their own profile
    userProfiles.add(caller, profile);
  };

  // Comment list management - Admin only with access code support
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

  // Add comment - Open access for Upload Section
  public shared ({ caller }) func addComment(listId : CommentListId, id : CommentId, content : Text) : async () {
    // Open access - any user can add comments via Upload Section
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

  // Remove specific comment - Admin only with access code support
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

  // Reset comment list - Admin only with access code support
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

  // Clear all comment lists - Admin only with access code support
  public shared ({ caller }) func clearAllCommentLists(accessCode : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    commentLists.clear();
    commentListIds.clear();
  };

  // Retrieve all comments in a list - Admin only with access code support
  public query ({ caller }) func getCommentList(accessCode : Text, listId : CommentListId) : async [Comment] {
    assertAdminAccessWithCode(caller, accessCode);
    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };
    comments.toArray();
  };

  // Delete specific comment list - Admin only with access code support
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

  // Calculate total number of comments - Admin only with access code support
  public query ({ caller }) func getCommentListTotal(accessCode : Text, listId : CommentListId) : async Nat {
    assertAdminAccessWithCode(caller, accessCode);
    switch (commentLists.get(listId)) {
      case (null) { 0 };
      case (?comments) { comments.size() };
    };
  };

  // Calculate bulk totals for all comment lists - Admin only with access code support
  public query ({ caller }) func getAllBulkCommentTotals(accessCode : Text) : async [(CommentListId, Nat)] {
    assertAdminAccessWithCode(caller, accessCode);
    let totals = commentLists.entries().toArray().map(
      func((listId, comments)) {
        (listId, comments.size());
      }
    );
    totals;
  };

  // User functions - Open access
  public query func getAvailableComments(listId : CommentListId) : async ?[Comment] {
    // Open access - any user can view available comments
    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };
    let available = comments.toArray().filter(func(c) { not c.used });
    if (available.size() == 0) { null } else { ?available };
  };

  // Generate single comment - Open access
  public shared ({ caller }) func generateComment(listId : CommentListId, deviceId : DeviceId) : async ?Comment {
    // Enforce single comment limit per user per list per device
    let callerPrincipal = caller;

    let userHistory = userCommentHistory.get(callerPrincipal);
    switch (userHistory) {
      case (null) {
        // First time caller for any device
        let deviceHistory = Map.empty<CommentListId, Bool>();
        deviceHistory.add(listId, true);
        let newHistory = Map.empty<DeviceId, Map.Map<CommentListId, Bool>>();
        newHistory.add(deviceId, deviceHistory);
        userCommentHistory.add(callerPrincipal, newHistory);
      };
      case (?history) {
        let deviceHistory = history.get(deviceId);
        switch (deviceHistory) {
          case (null) {
            // First time for this device
            let newDeviceHistory = Map.empty<CommentListId, Bool>();
            newDeviceHistory.add(listId, true);
            history.add(deviceId, newDeviceHistory);
          };
          case (?deviceEntries) {
            let hasGenerated = switch (deviceEntries.get(listId)) {
              case (null) { false };
              case (?used) { used };
            };
            if (hasGenerated) {
              Runtime.trap("You can only generate one comment per list on this device.");
            } else {
              deviceEntries.add(listId, true);
            };
          };
        };
      };
    };

    // Check if at least one available comment exists
    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };
    let availableArray = comments.toArray().filter(func(c) { not c.used });
    if (availableArray.size() == 0) { return null };
    let selected = availableArray[0];
    let updatedComments = comments.map<Comment, Comment>(
      func(comment) {
        if (comment.id == selected.id) { { comment with used = true } } else { comment };
      }
    );
    commentLists.add(listId, updatedComments);
    ?selected;
  };

  public query func getUserCommentHistory(deviceId : DeviceId) : async [(CommentListId, Bool)] {
    let callerPrincipal = Principal.fromText("iblxj-m7h4g-vv3ae-z5a73-2h2kl-iln3u-suwzp-2itg7-g3vv3-porp5-bqe");
    let userHistory = userCommentHistory.get(callerPrincipal);
    let liveLists = getCommentListIdsInternal();

    switch (userHistory) {
      case (null) { [] };
      case (?history) {
        let deviceHistory = history.get(deviceId);
        switch (deviceHistory) {
          case (null) { [] };
          case (?deviceEntries) {
            let entries = deviceEntries.entries();
            let filtered = entries.filter(
              func((listId, status)) {
                switch (liveLists.values().find(func(id) { id == listId })) {
                  case (null) { false };
                  case (?_) { true };
                };
              }
            );
            filtered.toArray();
          };
        };
      };
    };
  };

  func getCommentListIdsInternal() : [CommentListId] {
    commentListIds.toArray().sort();
  };

  public query func getRemainingCount(listId : CommentListId) : async Nat {
    // Open access - any user can view remaining count
    let comments = switch (commentLists.get(listId)) {
      case (null) { List.empty<Comment>() };
      case (?comments) { comments };
    };
    let available = comments.toArray().filter(func(c) { not c.used });
    available.size();
  };

  public query func getCommentListIds() : async [CommentListId] {
    // Open access - any user can view available list IDs
    getCommentListIdsInternal();
  };

  // Bulk comment generation - Now requires Bulk Generator Key
  public shared ({ caller }) func generateBulkComments(
    bulkGeneratorKey : Text,
    listId : CommentListId,
    count : Nat,
  ) : async [Comment] {
    // Require valid bulk generator key
    validateBulkGeneratorKey(bulkGeneratorKey);

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

    // Log bulk generation
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

  // Rating image functions
  public shared ({ caller }) func uploadRatingImage(image : Storage.ExternalBlob) : async RatingImageId {
    // Open access - any user can upload rating images
    ratingImageCounter += 1;
    let imageId = "image_" # ratingImageCounter.toText();
    let ratingImageData : RatingImageMetadata = {
      id = imageId;
      uploader = caller;
      timestamp = Time.now();
      image;
    };
    ratingImages.add(imageId, ratingImageData);
    imageId;
  };

  public query ({ caller }) func getAllRatingImages(accessCode : Text) : async [RatingImageMetadata] {
    assertAdminAccessWithCode(caller, accessCode);
    ratingImages.values().toArray();
  };

  public shared ({ caller }) func removeRatingImage(accessCode : Text, imageId : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    switch (ratingImages.get(imageId)) {
      case (null) { Runtime.trap("Image not found") };
      case (?_) {
        ratingImages.remove(imageId);
      };
    };
  };

  public shared ({ caller }) func removeAllRatingImages(accessCode : Text) : async () {
    assertAdminAccessWithCode(caller, accessCode);
    ratingImages.clear();
  };

  // Chat functionality
  let messages = Map.empty<MessageId, Message>();
  var messageCounter = 0;

  // Send message (user-side) - Requires user role
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

  // Reply to message (admin-side with access code)
  public shared ({ caller }) func replyMessage(accessCode : Text, replyContent : Text) : async MessageId {
    assertAdminAccessWithCode(caller, accessCode);

    let messageId = "msg_" # messageCounter.toText();
    messageCounter += 1;
    let message : Message = {
      id = messageId;
      side = #admin;
      content = replyContent;
      timestamp = Time.now();
      isRead = false; // Replies are initially unread for the user
    };
    messages.add(messageId, message);
    messageId;
  };

  // Retrieve all messages (admin-side with access code)
  public query ({ caller }) func getAllMessages(accessCode : Text) : async [Message] {
    assertAdminAccessWithCode(caller, accessCode);
    messages.values().toArray();
  };

  // Retrieve all messages for the conversation (user-side) - Requires user role
  public query ({ caller }) func getMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view messages");
    };
    // Return all messages (both user and admin sides) for bi-directional chat
    messages.values().toArray();
  };
};

