class GroupModel {
  constructor(payload) {
    this.Gid = payload.Gid;
    this.GroupName = payload.GroupName;
    this.BusinessOrSchoolName = payload.BusinessOrSchoolName;
    this.GameType = payload.GameType;
    this.AdminJoinCode = payload.AdminJoinCode;
    this.CreatedByUid = payload.CreatedByUid;
    this.MaxMemberSubgroups = payload.MaxMemberSubgroups;
    this.TeamsEnabled = Boolean(payload.TeamsEnabled);
    this.IsBusinessGroup = payload.IsBusinessGroup !== undefined ? Boolean(payload.IsBusinessGroup) : true;
    this.ApprovedAdmins = payload.ApprovedAdmins || [];
    this.CreatedAt = payload.CreatedAt;
  }

  toJSON() {
    return {
      Gid: this.Gid,
      GroupName: this.GroupName,
      BusinessOrSchoolName: this.BusinessOrSchoolName,
      GameType: this.GameType,
      AdminJoinCode: this.AdminJoinCode,
      CreatedByUid: this.CreatedByUid,
      MaxMemberSubgroups: this.MaxMemberSubgroups,
      TeamsEnabled: this.TeamsEnabled,
      IsBusinessGroup: this.IsBusinessGroup,
      ApprovedAdmins: this.ApprovedAdmins,
      CreatedAt: this.CreatedAt,
    };
  }
}

export default GroupModel;

