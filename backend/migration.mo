import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    adminAccessCodes : Map.Map<Text, Text>;
    bulkKeysActive : Map.Map<Text, Text>;
    bulkKeysDisabled : Map.Map<Text, Text>;
    comments : List.List<Comment>;
    liveRatingList : List.List<LiveRatingListEntry>;
    ratingImages : Map.Map<Text, RatingImageMetadata>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    globalAccessKey : ?Text;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    adminAccessCodes : Map.Map<Text, Text>;
    bulkKeysActive : Map.Map<Text, Text>;
    bulkKeysDisabled : Map.Map<Text, Text>;
    comments : List.List<Comment>;
    liveRatingList : List.List<LiveRatingListEntry>;
    ratingImages : Map.Map<Text, RatingImageMetadata>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    accessKeys : Map.Map<Text, AccessKey>;
  };

  type UserProfile = {
    name : Text;
  };

  type LiveRatingListEntry = {
    id : Text;
    name : Text;
    status : Bool;
  };

  type Comment = {
    id : Text;
    content : Text;
    isAdminComment : Bool;
    used : Bool;
  };

  type RatingImageMetadata = {
    id : Text;
    uploader : Principal.Principal;
    userName : Text;
    timestamp : Time.Time;
    image : Storage.ExternalBlob;
  };

  type AccessKey = {
    description : Text;
    key : Text;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      accessKeys = Map.empty<Text, AccessKey>();
    };
  };
};
