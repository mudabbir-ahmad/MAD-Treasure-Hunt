import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Screen from "../layout/Screen";
import Card from "../UI/Card";
import { Button } from "../UI/Button";
import PendingApprovalView from "../UI/PendingApprovalView";
import useGameHook from "../../hooks/useGameHook";
import { getSession } from "../../hooks/SessionStore";

const PlayersScreen = ({ navigation, route }) => {
  //   Initialisation ------------

  const session = getSession();
  const {
    getTeams,
    getTeamMembers,
    getGroupMembers,
    removeMember,
    resetPlayerProgress,
    getUser,
    getAdminWaitlist,
    approveAdmin,
    rejectAdmin,
    getSubgroups,
  } = useGameHook();
  const isBusiness = Boolean(session.isBusiness);
  const isAdmin = Boolean(session.isAcceptedAdmin);
  const selectedDepartment = route?.params?.department || null;
  const effectiveSGid = isBusiness
    ? isAdmin && selectedDepartment?.SGid
      ? selectedDepartment.SGid
      : isAdmin
        ? null
        : session.currentSGid
    : null;

  //   State ----------------------

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [adminTeam, setAdminTeam] = useState([]);
  const [isCurrentUserAdminLead, setIsCurrentUserAdminLead] = useState(false);
  const [adminTeamExpanded, setAdminTeamExpanded] = useState(false);

  //   Handlers -------------------

  const loadData = useCallback(async () => {
    if (!session.currentGid) {
      setLoading(false);
      return;
    }

    if (isBusiness && isAdmin && !selectedDepartment) {
      const sgs = await getSubgroups(session.currentGid);
      setDepartmentList((sgs || []).filter((sg) => !sg.IsAdminGroup));

      const allOrgMembers = await getGroupMembers(session.currentGid, null);
      const seenAdminUids = new Set();
      const acceptedAdmins = (allOrgMembers || [])
        .filter((m) => m.IsAcceptedAdmin)
        .sort((a, b) => Number(a.id) - Number(b.id))
        .filter((m) => {
          if (seenAdminUids.has(m.Uid)) return false;
          seenAdminUids.add(m.Uid);
          return true;
        });

      const adminRows = [];
      for (const member of acceptedAdmins) {
        const user = await getUser(member.Uid);
        if (!user) continue;
        adminRows.push({
          Uid: member.Uid,
          username: user.username || `User ${member.Uid}`,
          membershipId: member.id,
        });
      }
      setAdminTeam(adminRows);
      setIsCurrentUserAdminLead(
        adminRows.length > 0 && adminRows[0].Uid === session.currentUid,
      );
      setPlayers([]);
      setLoading(false);
      return;
    }

    setAdminTeam([]);
    setIsCurrentUserAdminLead(false);

    // Load subgroup names for department display (business accounts)
    let subgroupNameMap = {};
    if (isBusiness) {
      const sgs = await getSubgroups(session.currentGid);
      for (const sg of sgs || []) {
        if (!sg.IsAdminGroup) subgroupNameMap[sg.SGid] = sg.SubGroupName;
      }
    }

    // Get ALL members (including admins)
    const allMembers = await getGroupMembers(
      session.currentGid,
      effectiveSGid ?? null,
    );

    // Get admin waitlist entries
    const waitlist = effectiveSGid
      ? []
      : await getAdminWaitlist(session.currentGid);

    // Deduplicate allMembers by Uid — a user may have two rows if they were a
    // regular member before being approved as an admin. Prefer the admin row.
    const seenUids = new Set();
    const uniqueMembers = (allMembers || [])
      .sort((a, b) => (b.IsAcceptedAdmin ? 1 : 0) - (a.IsAcceptedAdmin ? 1 : 0))
      .filter((m) => {
        if (seenUids.has(m.Uid)) return false;
        seenUids.add(m.Uid);
        return true;
      });

    // Build team lookup: { Uid -> { teamCode, teamName, isLeader } }
    const allTeams = await getTeams(session.currentGid, effectiveSGid ?? null);
    const teamInfoByUid = {};
    for (const team of allTeams || []) {
      const tms = await getTeamMembers(team.Tid);
      for (const tm of tms || []) {
        teamInfoByUid[tm.Uid] = {
          teamCode: team.JoinCode,
          teamName: team.TeamName,
          isLeader: Boolean(tm.IsLeader),
        };
      }
    }

    // Build player list — include admins with tags
    const playerList = [];
    for (const m of uniqueMembers) {
      // Skip the current admin viewing the list
      if (m.Uid === session.currentUid) continue;
      const user = await getUser(m.Uid);
      if (user) {
        // A group member may also be on the admin waitlist (applied after joining as a player).
        // Check the waitlist first so they are treated as pending, not a regular player.
        const waitlistEntry = (waitlist || []).find((w) => w.Uid === m.Uid);
        let adminTag = null;
        let waitlistId = null;
        if (waitlistEntry) {
          adminTag = "[Admin Awaiting Response]";
          waitlistId = waitlistEntry.id;
        } else if (m.IsAcceptedAdmin) {
          adminTag = "[ADMIN]";
        }
        playerList.push({
          ...user,
          membershipId: m.id,
          team: teamInfoByUid[m.Uid] || null,
          adminTag,
          waitlistId,
          departmentName: subgroupNameMap[m.SGid] || null,
        });
      }
    }

    // Include waitlisted users who are not yet group members at all
    for (const w of waitlist || []) {
      if (playerList.some((p) => p.Uid === w.Uid)) continue;
      if (w.Uid === session.currentUid) continue;
      const user = await getUser(w.Uid);
      if (user) {
        playerList.push({
          ...user,
          membershipId: null,
          team: null,
          adminTag: "[Admin Awaiting Response]",
          waitlistId: w.id,
          departmentName: null,
        });
      }
    }

    setPlayers(playerList);
    setLoading(false);
  }, [
    session.currentGid,
    session.currentUid,
    session.currentSGid,
    isBusiness,
    isAdmin,
    selectedDepartment,
    selectedDepartment?.SGid,
    effectiveSGid,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemovePlayer = async (membershipId) => {
    await removeMember(membershipId);
    await loadData();
  };

  const handleResetPlayerProgress = (player) => {
    Alert.alert(
      "Reset Progress",
      `Reset all cache claims for ${player.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetPlayerProgress(
              session.currentGid,
              player.Uid,
              effectiveSGid,
            );
            Alert.alert(
              "Done",
              `Progress for ${player.username} has been reset.`,
            );
          },
        },
      ],
    );
  };

  // Approve a waitlisted admin and refresh the list
  const handleApproveAdmin = async (player) => {
    await approveAdmin(player.waitlistId);
    await loadData();
  };

  // Deny (remove from waitlist) a pending admin and refresh the list
  const handleDenyAdmin = async (player) => {
    await rejectAdmin(player.waitlistId);
    await loadData();
  };

  const handleKickAdmin = (adminMember) => {
    if (!isCurrentUserAdminLead || adminMember.Uid === session.currentUid)
      return;
    Alert.alert(
      "Kick Admin",
      `Remove ${adminMember.username} from the admin team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Kick",
          style: "destructive",
          onPress: async () => {
            await removeMember(adminMember.membershipId);
            await loadData();
          },
        },
      ],
    );
  };

  //   View -----------------------

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (!session.currentGid) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.body}>Create or join a game first.</Text>
      </Screen>
    );
  }

  if (session.isPendingAdmin && !session.isAcceptedAdmin) {
    return <PendingApprovalView />;
  }

  if (isBusiness && isAdmin && !selectedDepartment) {
    return (
      <Screen style={styles.container}>
        <Text style={styles.sectionTitle}>Departments</Text>
        <ScrollView style={styles.listSection}>
          <Card>
            <Pressable onPress={() => setAdminTeamExpanded((prev) => !prev)}>
              <View style={styles.playerRow}>
                <Text style={styles.playerName}>Admin Team</Text>
                <Text style={styles.openLabel}>
                  {adminTeamExpanded ? "Close" : "Open"}
                </Text>
              </View>
            </Pressable>
            {adminTeamExpanded && (
              <View style={styles.adminTeamWrap}>
                {adminTeam.map((adminMember, index) => (
                  <View key={adminMember.Uid} style={styles.adminTeamRow}>
                    <Text style={styles.adminTeamName} numberOfLines={1}>
                      {adminMember.username}
                      {index === 0 ? " (Admin Lead)" : ""}
                    </Text>
                    {isCurrentUserAdminLead &&
                      adminMember.Uid !== session.currentUid && (
                        <Button
                          label="Kick Admin"
                          onClick={() => handleKickAdmin(adminMember)}
                          styleButton={styles.removeButton}
                          styleLabel={styles.kickLabel}
                        />
                      )}
                  </View>
                ))}
                {adminTeam.length === 0 && (
                  <Text style={styles.emptyText}>No approved admins yet.</Text>
                )}
              </View>
            )}
          </Card>
          {departmentList.map((department) => (
            <Pressable
              key={department.SGid}
              onPress={() =>
                navigation.navigate("PlayersScreen", { department })
              }
            >
              <Card>
                <View style={styles.playerRow}>
                  <Text style={styles.playerName}>
                    {department.SubGroupName}
                  </Text>
                  <Text style={styles.openLabel}>Open</Text>
                </View>
              </Card>
            </Pressable>
          ))}
          {departmentList.length === 0 && (
            <Text style={styles.emptyText}>No departments yet.</Text>
          )}
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} showBack={Boolean(selectedDepartment)}>
      <Text style={styles.sectionTitle}>Players</Text>
      <ScrollView style={styles.listSection}>
        {players.map((player) => (
          // Waitlisted admins get a light red tint so they stand out from regular players
          <Card
            key={player.Uid}
            style={player.waitlistId ? styles.waitlistCard : undefined}
          >
            <View style={styles.playerRow}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.username}
                {player.adminTag && (
                  <Text
                    style={
                      player.adminTag === "[ADMIN]"
                        ? styles.adminBadge
                        : styles.waitlistBadge
                    }
                  >
                    {" "}
                    {player.adminTag}
                  </Text>
                )}
                {/* Show department name in brackets for non-admin players (org accounts) */}
                {!player.adminTag && player.departmentName && (
                  <Text style={styles.departmentName}>
                    {" "}
                    ({player.departmentName})
                  </Text>
                )}
              </Text>
              <View style={styles.playerMeta}>
                {player.team?.isLeader && (
                  <Text style={styles.leaderBadge}>(Team Leader)</Text>
                )}
                {player.team && (
                  <Text style={styles.teamCodeBadge}>
                    {player.team.teamCode}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.actionRow}>
              {/* Waitlisted admins get Approve / Deny instead of the normal player actions */}
              {player.waitlistId ? (
                <>
                  <Button
                    label="Approve"
                    onClick={() => handleApproveAdmin(player)}
                    styleButton={styles.approveButton}
                    styleLabel={styles.actionLabel}
                  />
                  <Button
                    label="Deny"
                    onClick={() => handleDenyAdmin(player)}
                    styleButton={styles.denyButton}
                    styleLabel={styles.actionLabel}
                  />
                </>
              ) : (
                <>
                  {!player.adminTag && (
                    <Button
                      label="Reset Progress"
                      onClick={() => handleResetPlayerProgress(player)}
                      styleButton={styles.resetButton}
                      styleLabel={styles.actionLabel}
                    />
                  )}
                  {player.membershipId && (
                    <Button
                      label="Kick"
                      onClick={() => handleRemovePlayer(player.membershipId)}
                      styleButton={styles.removeButton}
                      styleLabel={styles.kickLabel}
                    />
                  )}
                </>
              )}
            </View>
          </Card>
        ))}
        {players.length === 0 && (
          <Text style={styles.emptyText}>No players have joined yet.</Text>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center", flex: 1 },
  container: { padding: 0 },
  body: { color: "#bac2de", fontSize: 15 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#cdd6f4",
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  openLabel: { fontSize: 13, fontWeight: "700", color: "#bd93f9" },
  listSection: { flex: 1, paddingHorizontal: 15 },
  emptyText: {
    color: "#6c7086",
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  playerName: { fontSize: 15, fontWeight: "600", color: "#cdd6f4", flex: 1 },
  playerMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  leaderBadge: { fontSize: 11, color: "#bd93f9", fontWeight: "700" },
  teamCodeBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#a6e3a1",
    letterSpacing: 1,
  },
  adminBadge: { fontSize: 12, fontWeight: "700", color: "#D92800" },
  waitlistBadge: { fontSize: 11, fontWeight: "600", color: "#f4a460" },
  actionRow: { flexDirection: "row", gap: 8 },
  resetButton: {
    backgroundColor: "#86efac",
    borderColor: "#86efac",
    minHeight: 36,
    flex: 1,
    paddingHorizontal: 10,
  },
  removeButton: {
    backgroundColor: "#D92800",
    borderColor: "#D92800",
    minHeight: 36,
    flex: 1,
    paddingHorizontal: 10,
  },
  actionLabel: { color: "#1e1e2e", fontWeight: "600", fontSize: 13 },
  kickLabel: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  adminTeamWrap: { gap: 8 },
  adminTeamRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  adminTeamName: { flex: 1, fontSize: 14, color: "#cdd6f4", fontWeight: "600" },
  departmentName: { fontSize: 14, color: "#6c7086", fontStyle: "italic" },
  waitlistCard: {
    backgroundColor: "rgba(217, 40, 0, 0.15)",
    borderColor: "#D92800",
  },
  approveButton: {
    backgroundColor: "#a6e3a1",
    borderColor: "#a6e3a1",
    minHeight: 36,
    flex: 1,
    paddingHorizontal: 10,
  },
  denyButton: {
    backgroundColor: "#D92800",
    borderColor: "#D92800",
    minHeight: 36,
    flex: 1,
    paddingHorizontal: 10,
  },
});

export default PlayersScreen;
