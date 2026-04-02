class Cache {
  constructor(id, latitude, longitude, radius, clue, groupId, subgroupId) {
    this.id = id;
    this.coordinates = { latitude, longitude };
    this.radius = radius;
    this.clue = clue;
    this.groupId = groupId;
    this.subgroupId = subgroupId;
  }

  toJSON() {
    return { ...this };
  }
}

export default Cache;

