import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal.Principal, UserProfile>();

  type BulkKey = Text;
  type AccessCode = Text;

  type LiveRatingListEntry = {
    id : Text;
    name : Text;
    status : Bool;
  };

  public type Comment = {
    id : Text;
    content : Text;
    isAdminComment : Bool;
    used : Bool;
  };

  public type RatingImageMetadata = {
    id : Text;
    uploader : Principal.Principal;
    userName : Text;
    timestamp : Time.Time;
    image : Storage.ExternalBlob;
  };

  let liveRatingList = List.empty<LiveRatingListEntry>();
  let comments = List.empty<Comment>();

  let adminAccessCodes = Map.empty<Text, AccessCode>();
  let bulkKeysActive = Map.empty<Text, BulkKey>();
  let bulkKeysDisabled = Map.empty<Text, BulkKey>();
  let ratingImages = Map.empty<Text, RatingImageMetadata>();

  public type AccessKey = {
    description : Text;
    key : Text;
  };

  let accessKeys = Map.empty<Text, AccessKey>();

  public shared ({ caller }) func createAccessKey(description : Text, key : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create access keys");
    };

    let accessKey : AccessKey = {
      description;
      key;
    };

    accessKeys.add(key, accessKey);
  };

  public query ({ caller }) func getAccessKeys() : async [AccessKey] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get access keys");
    };
    accessKeys.values().toArray();
  };

  public shared ({ caller }) func updateAccessKey(key : Text, newDescription : Text, newKey : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update access keys");
    };

    let existingKey = accessKeys.get(key);
    switch (existingKey) {
      case (?_) {
        accessKeys.remove(key);
        let updatedAccessKey : AccessKey = {
          description = newDescription;
          key = newKey;
        };
        accessKeys.add(newKey, updatedAccessKey);
      };
      case null {
        Runtime.trap("Access key not found");
      };
    };
  };

  public shared ({ caller }) func deleteAccessKey(key : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete access keys");
    };

    let existingKey = accessKeys.get(key);
    switch (existingKey) {
      case (?_) {
        accessKeys.remove(key);
      };
      case null {
        Runtime.trap("Access key not found");
      };
    };
  };

  public query ({ caller }) func validateAccessKey(key : Text) : async Bool {
    accessKeys.containsKey(key);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getLiveRatingListEntries() : async [LiveRatingListEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view live rating list");
    };
    liveRatingList.toArray();
  };

  public shared ({ caller }) func addLiveRatingListEntry(id : Text, name : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add entries");
    };

    let entry : LiveRatingListEntry = {
      id;
      name;
      status = false;
    };

    liveRatingList.add(entry);
  };

  public shared ({ caller }) func updateLiveRatingListEntryStatus(id : Text, status : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update entry status");
    };

    let filteredList = liveRatingList.filter(
      func(entry) { entry.id != id }
    );

    let entry : LiveRatingListEntry = {
      id;
      name = "";
      status;
    };

    filteredList.add(entry);
    liveRatingList.clear();
    let iter = filteredList.values();
    for (entry in iter) {
      liveRatingList.add(entry);
    };
  };

  public shared ({ caller }) func deleteLiveRatingListEntry(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete entries");
    };

    let filteredList = liveRatingList.filter(
      func(entry) { entry.id != id }
    );

    liveRatingList.clear();
    let iter = filteredList.values();
    for (entry in iter) {
      liveRatingList.add(entry);
    };
  };

  public query ({ caller }) func checkLiveNameExists(name : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check live names");
    };
    liveRatingList.any(func(entry) { entry.name == name });
  };

  public shared ({ caller }) func createAdminAccessCode() : async AccessCode {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create access codes");
    };

    let timestamp = Time.now().toText();
    let code = "MD-" # timestamp;
    adminAccessCodes.add(code, code);
    code;
  };

  public shared ({ caller }) func useAdminAccessCode(accessCode : AccessCode) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use admin access codes");
    };

    let codeExists = adminAccessCodes.get(accessCode);

    switch (codeExists) {
      case (?_) {
        adminAccessCodes.remove(accessCode);
        true;
      };
      case null {
        Runtime.trap("Invalid access code");
      };
    };
  };

  public shared ({ caller }) func getAccessCodesForAdmin() : async [AccessCode] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view access codes");
    };
    adminAccessCodes.values().toArray();
  };

  public query ({ caller }) func getComments() : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };
    comments.toArray();
  };

  public shared ({ caller }) func generateAiComments(
    commentCount : Nat,
    commentLength : Nat,
  ) : async [(Text, Text)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can generate AI comments");
    };

    if (commentCount > 115) {
      Runtime.trap(
        "Maximum 115 comments allowed. Please reduce the quantity."
      );
    };

    if (commentCount == 0) {
      Runtime.trap("Comment count must be at least 1");
    };

    let actualContentLength = if (commentLength > 800) {
      800;
    } else {
      commentLength;
    };

    func generateContent(index : Nat) : Text {
      let baseContent = "Generated AI comment #" # index.toText() # ". ";
      var repeatCount = actualContentLength / 40;
      if (repeatCount == 0) {
        repeatCount := 1;
      };

      let placeholderText = "This is AI-generated content for testing. ";
      var result = baseContent;

      var count = 0;
      while (count < repeatCount) {
        result := result # placeholderText;
        count += 1;
      };

      result # " \u{2B50}";
    };

    let resultArrayRepeat = Array.tabulate(
      commentCount,
      func(i) {
        let comment : Comment = {
          id = "comment_" # i.toText();
          content = generateContent(i);
          isAdminComment = true;
          used = false;
        };
        (comment.id, comment.content);
      }
    );
    resultArrayRepeat;
  };

  public type RatingImage = {
    id : Text;
    uploader : Principal.Principal;
    userName : Text;
    timestamp : Time.Time;
    image : Storage.ExternalBlob;
  };

  public shared ({ caller }) func uploadImage(file : Storage.ExternalBlob) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload images");
    };

    let timestamp = Time.now();
    let id = timestamp.toText();

    let metadata : RatingImageMetadata = {
      id;
      uploader = caller;
      userName = "test";
      timestamp;
      image = file;
    };

    ratingImages.add(id, metadata);
    true;
  };

  public query ({ caller }) func getImages() : async [RatingImage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view images");
    };
    ratingImages.values().toArray().map<RatingImageMetadata, RatingImage>(
      func(metadata) { metadata }
    );
  };

  public shared ({ caller }) func generateBulkAccessKeys(keyCount : Nat) : async [BulkKey] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can generate access keys");
    };

    let outputList = List.empty<BulkKey>();
    var i = 0;

    while (i < keyCount) {
      let timestamp = Time.now().toText();
      let bulkKey = "MD-" # timestamp # "-" # i.toText();
      bulkKeysActive.add(bulkKey, bulkKey);
      outputList.add(bulkKey);
      i += 1;
    };

    outputList.toArray();
  };

  public shared ({ caller }) func useBulkAccessKey(bulkKey : BulkKey) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use bulk access keys");
    };

    let keyExists = bulkKeysActive.get(bulkKey);

    switch (keyExists) {
      case (?_) {
        bulkKeysDisabled.add(bulkKey, bulkKey);
        bulkKeysActive.remove(bulkKey);
        true;
      };
      case null {
        Runtime.trap("Invalid bulk key");
      };
    };
  };

  public shared ({ caller }) func generateAdminOnlyComments(
    txt : Text,
    adminCommentsEnabled : Bool,
  ) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can generate admin-only comments");
    };

    if (not adminCommentsEnabled) {
      Runtime.trap("Admin comments are disabled");
    };

    let comment : Comment = {
      id = "comment_";
      content = txt;
      isAdminComment = true;
      used = false;
    };

    comments.add(comment);
    true;
  };

  public query ({ caller }) func getAllKeys() : async {
    adminAccessCodes : [AccessCode];
    bulkKeysActive : [BulkKey];
    bulkKeysDisabled : [BulkKey];
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get all keys");
    };
    {
      adminAccessCodes = adminAccessCodes.values().toArray();
      bulkKeysActive = bulkKeysActive.values().toArray();
      bulkKeysDisabled = bulkKeysDisabled.values().toArray();
    };
  };

  public shared ({ caller }) func generateUserComments(customerComments : [Text]) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate user comments");
    };

    func addComment(commentText : Text) {
      let comment : Comment = {
        id = "comment_";
        content = commentText;
        isAdminComment = false;
        used = false;
      };
      comments.add(comment);
    };

    let iter = customerComments.values();
    for (comment in iter) {
      addComment(comment);
    };

    true;
  };

  public query ({ caller }) func getOtherComments() : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view other comments");
    };
    comments.values().toArray().filter(
      func(comment) { not comment.isAdminComment }
    );
  };

  public query ({ caller }) func getCommentStats() : async (Nat, Nat, Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get comment stats");
    };
    let total = comments.size();
    let usedCount = comments.foldLeft(
      0,
      func(acc, comment) {
        if (comment.used) { acc + 1 } else { acc };
      },
    );
    let remaining = total - usedCount;
    (total, usedCount, remaining);
  };

  public shared ({ caller }) func getNextUnusedComment() : async Comment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get next unused comment");
    };
    let nextUnused = comments.find(func(comment) { not comment.used });
    switch (nextUnused) {
      case (null) {
        Runtime.trap("No unused comments available");
      };
      case (?comment) {
        let updatedComments = comments.map<Comment, Comment>(
          func(c) {
            if (c.id == comment.id) {
              { c with used = true };
            } else { c };
          }
        );
        comments.clear();
        let iter = updatedComments.values();
        for (comment in iter) {
          comments.add(comment);
        };
        comment;
      };
    };
  };

  public shared ({ caller }) func addBulkComments(commentsArray : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add bulk comments");
    };

    let commentsList = List.empty<Text>();
    let iter = commentsArray.values();
    for (comment in iter) {
      commentsList.add(comment);
    };

    let iter2 = commentsList.values();
    for (comment in iter2) {
      let entry : Comment = {
        id = "comment_" # Time.now().toText();
        content = comment;
        isAdminComment = false;
        used = false;
      };
      comments.add(entry);
    };
  };
};
