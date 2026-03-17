class UserModel {
  constructor(payload) {
    this.Uid = payload.Uid;
    this.username = payload.username;
    this.email = payload.email;
    this.passwordHash = payload.passwordHash;
    this.isBusiness = Boolean(payload.isBusiness);
    this.IsAcceptedAdmin = Boolean(payload.IsAcceptedAdmin);
    this.Gid = payload.Gid ?? null;
    this.SGid = payload.SGid ?? null;
    this.TGid = payload.TGid ?? null;
  }

  toJSON() {
    return {
      Uid: this.Uid,
      username: this.username,
      email: this.email,
      passwordHash: this.passwordHash,
      isBusiness: this.isBusiness,
      IsAcceptedAdmin: this.IsAcceptedAdmin,
      Gid: this.Gid,
      SGid: this.SGid,
      TGid: this.TGid,
    };
  }
}

export default UserModel;

