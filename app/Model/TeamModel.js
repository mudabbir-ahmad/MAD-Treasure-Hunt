class TeamModel {
  constructor(payload) {
    this.Tid = payload.Tid;
    this.TeamName = payload.TeamName;
    this.Gid = payload.Gid;
    this.JoinCode = payload.JoinCode;
    this.CreatorUid = payload.CreatorUid;
    this.SGid = payload.SGid;
    this.CreatedAt = payload.CreatedAt;
  }

  toJSON() {
    return {
      Tid: this.Tid,
      TeamName: this.TeamName,
      Gid: this.Gid,
      JoinCode: this.JoinCode,
      CreatorUid: this.CreatorUid,
      SGid: this.SGid,
      CreatedAt: this.CreatedAt,
    };
  }
}

export default TeamModel;

