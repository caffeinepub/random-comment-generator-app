import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type OldCommentHistory = Map.Map<Text, Bool>;

  type OldActor = {
    userCommentHistory : Map.Map<Principal.Principal, OldCommentHistory>;
  };

  type NewCommentHistory = Map.Map<Text, Bool>;
  type DeviceHistory = Map.Map<Text, NewCommentHistory>;

  type NewActor = {
    userCommentHistory : Map.Map<Principal.Principal, DeviceHistory>;
  };

  public func run(old : OldActor) : NewActor {
    let newHistory = old.userCommentHistory.map<Principal.Principal, OldCommentHistory, DeviceHistory>(
      func(_user, oldEntry) {
        let deviceHistory = Map.empty<Text, NewCommentHistory>();
        deviceHistory;
      }
    );
    { userCommentHistory = newHistory };
  };
};
